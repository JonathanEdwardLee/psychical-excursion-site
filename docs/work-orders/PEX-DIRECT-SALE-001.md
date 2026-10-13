# PEX-DIRECT-SALE-001 — Audiobook direct sale

## Authority

Founder-approved commercial spec:
- price: **$11.11 USD**
- free Chapter 1 playable sample
- first-edition audiobook uses AI narration
- direct Stripe sale authorized after accepted audiobook package
- final accepted package is private and must not be committed or exposed at a guessable public URL

Accepted implementation baseline:
`b32624d71b52769e8b63c16d3dd772dbccea915c`

Accepted audiobook:
- listening edition: opening intro + Chapters 01–23
- 24 MP3s
- ZIP SHA-256: `e3d262d1ced05ad58c68f630f991500d93e4edac21e6837c088c465398faab8c`
- ZIP bytes: 533,240,805
- measured runtime: 23,393.65 s (~389.9 min)
- local package remains outside Git

## Objective

Create a complete, low-friction direct-sale experience on psychicalexcursion.com that lets a visitor:
1. understand the audiobook offer;
2. play Chapter 1 free before buying;
3. see the $11.11 price and founder-written AI narration note;
4. enter Stripe Checkout;
5. after verified payment, obtain the accepted audiobook through a protected delivery path;
6. generate privacy-safe conversion evidence.

This pass should minimize founder effort and recurring cost.

## Existing site constraints

The public guidebook is a static Vite site. Preserve:
- root mandala landing experience and brand;
- 23-chapter guidebook routes/content;
- Light/Dark behavior;
- Sky Clock;
- reader menu;
- D-081 analytics/privacy boundaries.

Do not reintroduce held personal-tool product scope.

Because the audiobook ZIP must not be public, do not fake protected delivery with an unlisted/static URL. If current hosting cannot securely implement server-side payment verification and protected file delivery inside the existing architecture, fail closed and return the smallest compatible server-side architecture/configuration required. Do not silently weaken the requirement.

## Storefront UX

Add an audiobook sales section under the homepage/landing **Read** experience without displacing the existing free book entry.

Required facts:
- title: **Psychical Excursion — First Edition Audiobook**
- price: **$11.11**
- approximately **6½ hours**
- 23 chapters
- free Chapter 1 sample
- direct download after purchase

Keep copy concise and consistent with the current visual system.

### AI narration disclosure

Visible short label:

**First-edition audiobook narrated with AI — a note from Jonathan below.**

Use the following founder-approved customer-facing note exactly except for typography/Markdown rendering:

> Thank you for being here and considering my book.
>
> I wrote *Psychical Excursion* as an experiment for myself and for anyone else curious enough to try some of these researched techniques and see what happens.
>
> Personally, I love audiobooks, and I wanted to make this first edition available without waiting another year to record it myself. So I chose to use AI narration.
>
> I know AI narration isn’t for everyone. I actually like what it brings to this book. There’s something a little futuristic and surreal about hearing an artificial voice guide you through dreams, altered states, consciousness, and a subject that already sits somewhere between science and the strange.
>
> This is the first edition, and in a lot of ways I’m still testing the waters. If people enjoy it and the book finds an audience, I’d love to narrate a future edition myself.
>
> For now, listen to the free sample and decide whether this version feels right for you.
>
> I hope you enjoy the experiment.
>
> I’ll meet you in the dream realm.
>
> — Jonathan Lee

Do not replace this with generic AI-written disclaimer copy.

Precise technical disclosure may additionally identify OpenAI Cedar in package/download/support documentation, but the storefront note above is the primary customer-facing explanation.

## Free Chapter 1 sample

Provide Chapter 1 as a public playable sample.

Requirements:
- use the founder-approved final Chapter 1 audio from PR #96;
- do not regenerate it;
- player must be accessible, responsive and visually integrated;
- no autoplay;
- track sample play/start using privacy-safe aggregate analytics only;
- do not send audio contents, IDs tied to identity, or free-text data to analytics.

If the sample binary cannot be safely added to the implementation repository because of repository-size/release constraints, implement the player and define the exact public static asset path/operator placement contract. Do not commit the full audiobook ZIP.

## Stripe

Use Stripe for payment.

Required product:
- Psychical Excursion — First Edition Audiobook
- one-time price: **$11.11 USD**
- quantity fixed at 1
- no subscription
- no upsell/bundle in this pass

Use server-side creation/verification where required. No secret keys in client bundles, Git, logs or analytics.

Do not depend on client-side success parameters alone as proof of payment.

Use the existing PIM/HSD Stripe account boundary; do not create another processor/account.

If a Stripe Product/Price ID or payment-link object must be created in the live Stripe account, keep configuration injectable and identify the exact founder/operator action required. Do not invent an ID.

## Protected delivery

The accepted ZIP must remain private.

Required characteristics:
- payment verified server-side before access;
- customer receives a time-limited or otherwise non-guessable authenticated delivery URL;
- direct static/public path to the ZIP is prohibited;
- expired/reused/invalid access must fail safely;
- no audiobook file in Git;
- no secrets in Git;
- support a practical retry path for a legitimate buyer.

Prefer the smallest reliable architecture supported by existing hosting and tools. Avoid new recurring subscriptions by default.

## Buyer copy

Add concise support/refund/delivery expectations:
- digital audiobook download;
- access appears after successful payment;
- if delivery fails, provide a clear support route;
- no fabricated refund promise. Use the business's actual intended refund policy or flag the precise policy text needed from founder before public activation.

Do not publish legal/policy claims that have not been accepted.

## Analytics

Extend existing GA4 privacy-safe measurement.

Track aggregate events for:
- audiobook offer viewed;
- Chapter 1 sample play/start;
- checkout start;
- purchase-success confirmation after server-side verified payment/delivery state.

Do not send:
- email;
- name;
- Stripe customer/payment/session IDs;
- free text;
- precise location;
- audiobook payload/content;
- private download token.

Preserve canonical pathname page views and avoid duplicate event firing.

## Security / failure behavior

Tests must cover at minimum:
- $11.11 product configuration;
- no secret exposed in client code;
- no full ZIP/static direct link;
- sample does not autoplay;
- payment success is not trusted from query string alone;
- unverified payment cannot retrieve audiobook;
- expired/invalid token fails closed;
- analytics event payloads contain no PII/payment IDs;
- existing 24 public canonical URLs/book navigation remain unchanged unless a deliberate new public sales route is added;
- existing guidebook tests stay green.

## Deployment boundary

CloudDev:
- implements in a separate implementation PR;
- does not merge;
- does not deploy production;
- does not create/live-activate Stripe objects;
- does not upload the private audiobook to public storage;
- does not need or receive control-repo access.

Primary will source-review exact implementation and identify any founder-only Stripe/storage/deployment actions.

## Return

Return with:
1. implementation PR number and exact head SHA;
2. exact changed files;
3. architecture for Stripe payment verification + protected delivery;
4. exact environment/config variables required;
5. exact founder/operator actions still required before activation;
6. proof the price is $11.11;
7. proof Chapter 1 sample is public-playable and full ZIP is not public;
8. analytics events and payload fields;
9. security/failure tests;
10. full CI result;
11. any recurring cost introduced (default must be $0 new recurring cost);
12. rollback plan.

Stop if secure delivery cannot be achieved on the current hosting surface without a material new service/cost; return evidence and the smallest viable option instead of weakening protection.
