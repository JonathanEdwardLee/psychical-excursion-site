# Google OAuth setup (founder / admin only)

This document lists protected steps to enable optional Google sign-in and Drive sync in production. **Do not commit client secrets or place secrets in public GitHub.**

## 1. Google Cloud project

1. Create or select a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **Google Drive API** for the project.

## 2. OAuth consent screen

1. Configure the OAuth consent screen (External or Internal per your organization).
2. Add app name **Psychical Excursion** and support email.
3. Scopes to add (minimum):
   - `openid`, `email`, `profile` (identity)
   - `https://www.googleapis.com/auth/drive.file` (Drive files created/opened by PEx only)
4. Do **not** add broad `drive` or `drive.readonly` scopes.

Verification: Google may require app verification for sensitive scopes in production. Plan verification before marketing wide Google sync.

## 3. OAuth client (Web application)

1. APIs & Services → Credentials → Create OAuth client ID → **Web application**.
2. **Authorized JavaScript origins** (production examples — replace with your live Hostinger domain):
   - `https://your-production-domain.example`
3. **Authorized redirect URIs**: not required for the GIS token client flow used by PEx (implicit/popup token in browser). If Google prompts for redirect URIs, use the same origin paths documented in Google's GIS OAuth web client guide for your deployment year.
4. Copy the **Client ID** only (never commit JSON client secret files to the repo).

## 4. Deploy configuration

Set at build time (Hostinger / CI secret or `.env.production.local` on founder machine — not in git):

```bash
VITE_GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Rebuild and deploy the static artifact (`npm run build`, `npm run package:release`).

Without this variable, PEx remains **fully local-only** with honest UI copy.

## 5. Post-deploy verification (manual)

1. Open `#/account` on production over HTTPS.
2. Sign in with Google → identity shows; journal still local.
3. Connect Google Drive separately → grant `drive.file`.
4. Capture → confirm local-safe → entry shows **Synced** after success.
5. Sign out / disconnect → local journal entries remain.

## 6. What PEx does not use

- No backend token exchange or PIM-hosted journal storage
- No client secret in the browser bundle
- No analytics or third-party telemetry on journal payloads
