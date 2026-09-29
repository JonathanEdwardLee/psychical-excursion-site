<?php
declare(strict_types=1);

require __DIR__ . '/lib.php';

try {
    $token = isset($_GET['token']) ? trim((string) $_GET['token']) : '';
    if ($token === '') {
        throw new RuntimeException('Missing token.');
    }

    $config = pex_audiobook_load_config();
    $tokenSecret = pex_audiobook_config_value($config, 'download_token_secret');
    $payload = pex_verify_download_token($tokenSecret, $token);
    if ($payload === null) {
        http_response_code(403);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'This download link is invalid or expired.';
        exit;
    }

    $sessionHash = (string) $payload['sid'];
    if (!pex_grant_exists($config, $sessionHash)) {
        http_response_code(403);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'This download link is invalid or expired.';
        exit;
    }

    $zipPath = pex_audiobook_config_value($config, 'audiobook_zip_path');
    if (!is_readable($zipPath)) {
        http_response_code(503);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Audiobook file is not available. Contact support@psychicalexcursion.com.';
        exit;
    }

    $filename = 'Psychical-Excursion-First-Edition-Audiobook.zip';
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . (string) filesize($zipPath));
    header('Cache-Control: private, no-store');
    readfile($zipPath);
} catch (Throwable $e) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Download denied.';
}
