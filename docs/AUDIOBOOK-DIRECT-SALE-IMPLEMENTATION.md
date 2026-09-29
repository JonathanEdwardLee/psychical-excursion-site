# Audiobook direct sale — CloudDev implementation (PEX-DIRECT-SALE-001)

## Architecture

| Layer | Role |
| --- | --- |
| Static Vite storefront | `/` landing teaser + `/audiobook/` sales page, Chapter 1 `<audio>` sample, same-origin checkout link |
| Hostinger PHP (`/api/audiobook/*.php`) | Create Stripe Checkout Session, verify `payment_status` server-side, issue HMAC download token, stream private ZIP |
| Private filesystem (outside `public_html`) | Accepted audiobook ZIP + grant metadata + `pex-audiobook-config.php` |

Payment is **not** trusted from client query parameters alone. `success.php` calls Stripe’s Checkout Session API before issuing a download token.

## Environment / config (founder-only)

Copy `deploy/api/audiobook/config.example.php` to a path **outside** `public_html` and set Hostinger env `PEX_AUDIOBOOK_CONFIG` to that path.

| Key | Purpose |
| --- | --- |
| `site_origin` | `https://psychicalexcursion.com` |
| `stripe_secret_key` | PIM/HSD Stripe secret (live when activating) |
| `stripe_price_id` | One-time **$11.11 USD** Price ID (create in Stripe; do not invent) |
| `audiobook_zip_path` | Absolute path to private ZIP (SHA per work order) |
| `grants_dir` | Writable directory for verified-session grants |
| `download_token_secret` | Long random HMAC secret |

## Founder / operator actions before activation

1. Create Stripe Product **Psychical Excursion — First Edition Audiobook** and one-time Price **$11.11 USD**; paste `price_…` into config.
2. Upload accepted ZIP to private storage (not Git, not a public URL).
3. Copy Chapter 1 MP3 to `public/audiobook/sample/chapter-01.mp3` per `public/audiobook/sample/README.md` and deploy.
4. Deploy PHP config + enable Hostinger PHP for `public_html/api/audiobook/`.
5. Confirm final refund/support wording (placeholder flagged on storefront).
6. Smoke-test checkout → success → download → expired token.

## Recurring cost

**$0** new recurring services (uses existing Hostinger + Stripe per-transaction fees).

## Rollback

1. Revert `main` to prior SHA and let CI republish `hostinger-deploy`.
2. Remove or disable `/api/audiobook/` PHP endpoints in Hostinger if needed.
3. Delete public sample MP3 from `public_html` if rolling back the offer.

## Analytics (GA4)

Aggregate custom events (no PII, no Stripe IDs):

- `pex_audiobook_offer_viewed` — `{ surface: "landing" | "audiobook" }`
- `pex_audiobook_sample_start` — `{ content_type: "audiobook_sample" }`
- `pex_audiobook_checkout_start` — `{ currency: "USD" }`
- `pex_audiobook_purchase_confirmed` — `{ currency: "USD" }` (server-rendered success page)
