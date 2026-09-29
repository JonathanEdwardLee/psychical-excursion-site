<?php
declare(strict_types=1);

const PEX_AUDIOBOOK_PRICE_CENTS = 1111;
const PEX_AUDIOBOOK_CURRENCY = 'usd';
const PEX_DOWNLOAD_TTL_SECONDS = 172800; // 48 hours

function pex_audiobook_load_config(): array
{
    $candidates = [
        getenv('PEX_AUDIOBOOK_CONFIG') ?: '',
        dirname(__DIR__, 3) . '/private/pex-audiobook-config.php',
        dirname(__DIR__, 2) . '/private/pex-audiobook-config.php',
    ];
    foreach ($candidates as $path) {
        if ($path !== '' && is_readable($path)) {
            $config = require $path;
            if (!is_array($config)) {
                throw new RuntimeException('Audiobook config must return an array.');
            }
            return $config;
        }
    }
    throw new RuntimeException('Missing audiobook config. Set PEX_AUDIOBOOK_CONFIG or deploy private/pex-audiobook-config.php.');
}

function pex_audiobook_config_value(array $config, string $key): string
{
    if (!isset($config[$key]) || !is_string($config[$key]) || $config[$key] === '') {
        throw new RuntimeException('Audiobook config missing key: ' . $key);
    }
    return $config[$key];
}

function pex_stripe_request(string $secretKey, string $method, string $path, array $fields = []): array
{
    $ch = curl_init('https://api.stripe.com/v1' . $path);
    if ($ch === false) {
        throw new RuntimeException('Unable to initialize Stripe request.');
    }
    $headers = ['Authorization: Bearer ' . $secretKey];
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    if ($method === 'POST' && $fields !== []) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($fields));
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $body = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($body === false) {
        throw new RuntimeException('Stripe request failed.');
    }
    $decoded = json_decode($body, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Stripe returned invalid JSON.');
    }
    if ($status < 200 || $status >= 300) {
        $message = isset($decoded['error']['message']) ? (string) $decoded['error']['message'] : 'Stripe error';
        throw new RuntimeException($message);
    }
    return $decoded;
}

function pex_grants_dir(array $config): string
{
    $dir = pex_audiobook_config_value($config, 'grants_dir');
    if (!is_dir($dir)) {
        if (!mkdir($dir, 0700, true) && !is_dir($dir)) {
            throw new RuntimeException('Unable to create grants directory.');
        }
    }
    return $dir;
}

function pex_issue_download_token(string $secret, string $sessionId, int $expiresAt): string
{
    $payload = json_encode([
        'sid' => hash('sha256', $sessionId),
        'exp' => $expiresAt,
    ], JSON_THROW_ON_ERROR);
    $payloadB64 = rtrim(strtr(base64_encode($payload), '+/', '-_'), '=');
    $sig = hash_hmac('sha256', $payloadB64, $secret);
    return $payloadB64 . '.' . $sig;
}

function pex_verify_download_token(string $secret, string $token): ?array
{
    $parts = explode('.', $token, 2);
    if (count($parts) !== 2) {
        return null;
    }
    [$payloadB64, $sig] = $parts;
    $expected = hash_hmac('sha256', $payloadB64, $secret);
    if (!hash_equals($expected, $sig)) {
        return null;
    }
    $json = base64_decode(strtr($payloadB64, '-_', '+/'), true);
    if ($json === false) {
        return null;
    }
    $payload = json_decode($json, true);
    if (!is_array($payload) || !isset($payload['sid'], $payload['exp'])) {
        return null;
    }
    if ((int) $payload['exp'] < time()) {
        return null;
    }
    return $payload;
}

function pex_store_grant(array $config, string $sessionId): string
{
    $grantsDir = pex_grants_dir($config);
    $tokenSecret = pex_audiobook_config_value($config, 'download_token_secret');
    $expiresAt = time() + PEX_DOWNLOAD_TTL_SECONDS;
    $token = pex_issue_download_token($tokenSecret, $sessionId, $expiresAt);
    $grantPath = $grantsDir . '/' . hash('sha256', $sessionId) . '.json';
    $grant = [
        'session_id_hash' => hash('sha256', $sessionId),
        'paid_at' => time(),
        'expires_at' => $expiresAt,
    ];
    file_put_contents($grantPath, json_encode($grant, JSON_THROW_ON_ERROR), LOCK_EX);
    return $token;
}

function pex_grant_exists(array $config, string $sessionIdHash): bool
{
    $grantsDir = pex_grants_dir($config);
    $grantPath = $grantsDir . '/' . $sessionIdHash . '.json';
    if (!is_readable($grantPath)) {
        return false;
    }
    $grant = json_decode((string) file_get_contents($grantPath), true);
    if (!is_array($grant) || !isset($grant['expires_at'])) {
        return false;
    }
    return (int) $grant['expires_at'] >= time();
}

function pex_verify_paid_session(array $config, string $sessionId): bool
{
    $secretKey = pex_audiobook_config_value($config, 'stripe_secret_key');
    $session = pex_stripe_request($secretKey, 'GET', '/checkout/sessions/' . rawurlencode($sessionId), []);
    if (($session['payment_status'] ?? '') !== 'paid') {
        return false;
    }
    $amount = isset($session['amount_total']) ? (int) $session['amount_total'] : -1;
    $currency = isset($session['currency']) ? (string) $session['currency'] : '';
    return $amount === PEX_AUDIOBOOK_PRICE_CENTS && $currency === PEX_AUDIOBOOK_CURRENCY;
}

function pex_site_origin(array $config): string
{
    return rtrim(pex_audiobook_config_value($config, 'site_origin'), '/');
}
