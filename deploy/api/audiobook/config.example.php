<?php
/**
 * Copy to a path OUTSIDE public_html (e.g. ~/private/pex-audiobook-config.php)
 * and set PEX_AUDIOBOOK_CONFIG in Hostinger hPanel environment variables.
 *
 * Do not commit live keys or the audiobook ZIP.
 */
return [
    'site_origin' => 'https://psychicalexcursion.com',
    'stripe_secret_key' => 'sk_live_...',
    'stripe_price_id' => 'price_...',
    'audiobook_zip_path' => '/home/USER/private/Psychical-Excursion-Audiobook-v1.zip',
    'grants_dir' => '/home/USER/private/pex-audiobook-grants',
    'download_token_secret' => 'generate-a-long-random-string',
];
