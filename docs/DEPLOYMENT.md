# Hostinger deployment topology

Psychical Excursion ships as a static PWA. `main` remains the development source of truth. Hostinger must never point at the Vite/TypeScript source tree.

## Release pattern

```text
main -> CI verify/build -> clean runtime artifact -> hostinger-deploy -> Hostinger public_html -> live verification
```

The `hostinger-deploy` branch contains only the production document root. Copy its contents into `public_html`.

```text
public_html/
  index.html
  SOURCE_SHA.txt
  .htaccess
  manifest.webmanifest
  sw.js
  assets/          (hashed JS/CSS)
  brand/           (founder lockups)
  icons/           (founder favicons + PWA icons)
```

Public URLs map directly to filesystem paths. Application routes are hash-based (`#/`, `#/today`, `#/day/1` … `#/day/60`). No SPA rewrite is required or wanted.

## Exact Hostinger Git fields

| Field | Value |
|---|---|
| Repository | `JonathanEdwardLee/psychical-excursion-site` |
| Branch | `hostinger-deploy` |
| Destination / root directory | `public_html` |
| Auto-deploy | enable **after** the first successful connection and a green `main` publish |
| Domain | `psychicalexcursion.com` (founder-selected public brand/apex) |
| Preferred canonical host | apex `https://psychicalexcursion.com` |
| www behavior | `https://www.psychicalexcursion.com` → 301 to apex (see `deploy/.htaccess`) |

Do **not** use Hostinger Node.js / Web App build commands. Do **not** set the Git branch to `main`.

## CI behavior

Pull requests run verify/build/package/artifact checks and **do not** update `hostinger-deploy`.

A successful push to `main` rebuilds from that exact SHA, re-verifies the artifact, and publishes only `release/` to `hostinger-deploy` with commit message `deploy: <source-sha>`. The same SHA is written to `SOURCE_SHA.txt` in the artifact.

Never publish a pull-request head to production.

## Founder-required hPanel steps (not done by CloudDev)

These steps require Hostinger account access and can overwrite a live document root. Confirm the target site is PEx before connecting Git.

1. In hPanel, open the website whose document root is the PEx `public_html` (stop if that root already belongs to a different site).
2. Attach domain `psychicalexcursion.com` to that site if it is not already assigned.
3. Advanced → Git → connect GitHub repository `JonathanEdwardLee/psychical-excursion-site`.
4. Set branch `hostinger-deploy` and directory `public_html`.
5. Deploy once after `hostinger-deploy` exists (created by CI on the first accepted `main` push that includes this workflow).
6. After that first verified deploy, enable automatic deployment.
7. DNS (if the domain is not already on this Hostinger site):
   - Apex `A` record(s) to the IPv4 shown in hPanel for this site.
   - `www` `CNAME` (or `A`) to the Hostinger www target for the same site.
8. SSL: issue/renew Let's Encrypt for both apex and `www`, then force HTTPS in hPanel if it is not already on.
9. Confirm Hostinger is not running a Node build against `main`.

CloudDev cannot complete GitHub↔Hostinger OAuth, DNS edits, or certificate issuance from this repository.

## Rollback

1. Identify the last accepted `main` SHA that was independently verified.
2. Re-run the publish path from that SHA (revert `main` to that commit, or cherry-pick/restore so CI publishes from it).
3. Hostinger auto-deploy (or a manual Git deploy) then replaces `public_html` with that runtime artifact.
4. Confirm `public_html/SOURCE_SHA.txt` matches the accepted source SHA.

Do not hot-edit files in `public_html` except emergency recovery. Any emergency change must be reconciled back into `main`.

## Live verification checklist (after Hostinger + DNS)

Pinned to `https://psychicalexcursion.com`:

- HTTPS certificate valid for apex; `www` redirects to apex
- Homepage, founder logo, favicon
- Manifest / installability
- Hash routes: Home, Today, Capture, Journal, Days, Method, About, Data
- Day 1, Day 51 (optional), Day 60
- 60-day content spot checks
- Capture text save
- Live microphone Record → Stop → replay on founder Android
- Journal save / edit / delete / export
- Persistence messaging
- Service worker update / offline-after-load / reopen
- No unexpected journal transmission
- 200% zoom / mobile layout / bedtime mode
- Hoopsnake attribution
- No development/debug surfaces

Do not claim production is live until those checks are done independently.

## Costs and stop conditions

No new recurring cost, payments, donations, ads, marketing, or backend services. Public Google Analytics 4 (`G-297PE2TV2R`) is founder-authorized. Stop if the Hostinger target would overwrite an unrelated `public_html`, if the domain/site assignment is ambiguous, or if the deployment branch cannot be proven to correspond to accepted `main`.
