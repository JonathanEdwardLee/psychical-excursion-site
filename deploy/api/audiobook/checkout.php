<?php
declare(strict_types=1);

require __DIR__ . '/lib.php';

try {
    $config = pex_audiobook_load_config();
    $secretKey = pex_audiobook_config_value($config, 'stripe_secret_key');
    $priceId = pex_audiobook_config_value($config, 'stripe_price_id');
    $origin = pex_site_origin($config);

    $session = pex_stripe_request($secretKey, 'POST', '/checkout/sessions', [
        'mode' => 'payment',
        'success_url' => $origin . '/api/audiobook/success.php?session_id={CHECKOUT_SESSION_ID}',
        'cancel_url' => $origin . '/audiobook/',
        'line_items[0][price]' => $priceId,
        'line_items[0][quantity]' => '1',
        'client_reference_id' => 'pex-audiobook-v1',
        'metadata[product]' => 'Psychical Excursion — First Edition Audiobook',
    ]);

    $url = isset($session['url']) ? (string) $session['url'] : '';
    if ($url === '') {
        throw new RuntimeException('Stripe did not return a checkout URL.');
    }
    header('Location: ' . $url, true, 303);
    exit;
} catch (Throwable $e) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Checkout is not available yet. Please try again later or contact support@psychicalexcursion.com.';
    exit;
}
