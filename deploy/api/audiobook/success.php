<?php
declare(strict_types=1);

require __DIR__ . '/lib.php';

const PEX_GA4_MEASUREMENT_ID = 'G-297PE2TV2R';
const PEX_GA4_PURCHASE_EVENT = 'pex_audiobook_purchase_confirmed';

function pex_render_success_page(string $downloadUrl): void
{
    $safeUrl = htmlspecialchars($downloadUrl, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $gaId = PEX_GA4_MEASUREMENT_ID;
    $event = PEX_GA4_PURCHASE_EVENT;
    header('Content-Type: text/html; charset=utf-8');
    echo <<<HTML
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>Audiobook download | Psychical Excursion</title>
  <script async src="https://www.googletagmanager.com/gtag/js?id={$gaId}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag("js", new Date());
    gtag("config", "{$gaId}", { send_page_view: false });
    gtag("event", "{$event}", { currency: "USD" });
  </script>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 36rem; margin: 3rem auto; padding: 0 1rem; line-height: 1.5; }
    a { color: inherit; }
  </style>
</head>
<body>
  <h1>Thank you</h1>
  <p>Your payment was verified. Download your audiobook within 48 hours:</p>
  <p><a href="{$safeUrl}">Download Psychical Excursion — First Edition Audiobook (ZIP)</a></p>
  <p>If the link expires or fails, email <a href="mailto:support@psychicalexcursion.com">support@psychicalexcursion.com</a> with your Stripe receipt.</p>
  <p><a href="/audiobook/">Back to audiobook page</a></p>
</body>
</html>
HTML;
}

function pex_render_failure(string $message): void
{
    header('Content-Type: text/html; charset=utf-8');
    http_response_code(403);
    $safe = htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    echo "<!doctype html><html lang=\"en\"><body><h1>Download unavailable</h1><p>{$safe}</p><p><a href=\"/audiobook/\">Return to audiobook page</a></p></body></html>";
}

try {
    $sessionId = isset($_GET['session_id']) ? trim((string) $_GET['session_id']) : '';
    if ($sessionId === '' || !preg_match('/^cs_[a-zA-Z0-9_]+$/', $sessionId)) {
        pex_render_failure('Missing or invalid checkout session.');
        exit;
    }

    $config = pex_audiobook_load_config();
    if (!pex_verify_paid_session($config, $sessionId)) {
        pex_render_failure('Payment could not be verified.');
        exit;
    }

    $token = pex_store_grant($config, $sessionId);
    $origin = pex_site_origin($config);
    $downloadUrl = $origin . '/api/audiobook/download.php?token=' . rawurlencode($token);
    pex_render_success_page($downloadUrl);
} catch (Throwable $e) {
    pex_render_failure('Delivery is temporarily unavailable.');
}
