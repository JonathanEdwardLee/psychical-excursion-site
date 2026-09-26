# PEx Work Order — Full Cedar Audiobook Production + Direct-Sale Package

## Baseline

Accepted implementation main:
`1b8ccba9f7f8ef8b760820cfb87e42e5537fba6b`

Accepted Cedar pilot evidence:
- model: `gpt-4o-mini-tts`
- voice: `cedar`
- founder-approved Chapter 10 excerpt
- 607 words / 223 seconds
- 3 successful API requests
- normalized sample approved by founder
- no Chatterbox production path; held
- full-book narration source: accepted deterministic session scripts

## Founder authorization

Jonathan explicitly authorizes:
1. generation of the **entire Psychical Excursion audiobook** with OpenAI Cedar;
2. API spend required to complete the audiobook, subject to a hard safety ceiling;
3. preparation of a finished direct-sale audiobook package;
4. later listing/sale from the Psychical Excursion site with Stripe after this production pass is accepted.

This work order covers **full audiobook production and packaging only**.
Website checkout/Stripe activation is the next pass after package acceptance.

## Hard spend ceiling

Default full-production ceiling:
**$15 USD total new OpenAI TTS spend for this audiobook production pass.**

Rationale:
- accepted estimate: ~$8.57 one pass
- ~$10.71 with 25% QC/regeneration allowance
- $15 provides bounded retry headroom without open-ended spend.

Fail closed before any call that would cause the conservative planned total to exceed $15.

If the operator's OpenAI account has insufficient prepaid balance, stop and report required top-up amount rather than bypassing the ceiling.

## Canonical source

Use only the accepted generated narration/session scripts under:
`publication/audio/session-scripts/`

Core narration source:
- 23 chapter scripts
- opening credits
- evidence/safety front matter where already accepted
- closing credits

Do not rewrite the Publication Master.
Do not alter chapter prose during generation.
Fix only deterministic production defects such as chunk boundaries, pronunciation instructions, or file assembly metadata.

## Voice / instructions

Provider/model:
- OpenAI
- `gpt-4o-mini-tts`
- voice `cedar`

Use the accepted direction prompt from `scripts/voice-lab/core.mjs` unless a production defect is documented.

Do not switch voices chapter-to-chapter.

## Generation architecture

Extend the Voice Lab tooling into a deterministic full-book generator.

Requirements:
- one command can generate all planned audiobook tracks;
- resumable/restart-safe;
- do not regenerate already verified chunks unless explicitly requested;
- per-track chunk manifests;
- per-request status and retry receipt;
- cost estimate before each track;
- cumulative cost ceiling enforcement;
- fail closed on API errors;
- bounded retry for transient 429/5xx;
- no retry loop on insufficient credits;
- secrets environment-only;
- no API key in logs/manifests;
- generated audio stays outside git.

Prefer local workspace:
`local/voice-lab/full-book/`

Suggested structure:
- `raw/<track>/chunk-001.wav`
- `assembled/<track>.wav`
- `mastered/<track>.wav`
- `delivery/<track>.mp3`
- `receipts/<track>.json`
- `PACKAGE-MANIFEST.json`

## Audio assembly

For each final track:
1. generate Cedar chunks;
2. verify chunk count/size/duration;
3. concatenate losslessly or deterministically;
4. inspect for truncation, repeated text, missing text, and obvious generation artifacts;
5. loudness-normalize/master from WAV;
6. produce delivery MP3 derivative.

Archive master target:
- mono PCM WAV
- 44.1 kHz
- 24-bit where practical after resampling/mastering
- clean, no clipping

Direct-sale MP3 target:
- 44.1 kHz
- mono
- CBR 192 kbps or higher
- consistent loudness across chapters
- chapter file boundaries preserved

Do not master toward streaming music loudness.
Use the existing audiobook production targets unless measured evidence requires a bounded adjustment.

## Text-to-audio integrity

For every track:
- record source script SHA-256;
- record normalized spoken-text SHA-256;
- preserve exact order;
- no citation markers/references;
- no raw URLs/DOIs;
- protected affirmations exact;
- no invented commentary;
- no dropped chapter endings;
- no duplicated chunk text.

Where automated speech-to-text verification is unavailable, use deterministic text/chunk receipts plus operator listening QC.

## Pronunciation

Apply accepted pronunciation guidance consistently.

Before full generation, fix only confirmed pronunciation instructions that can be expressed safely through TTS direction or text-safe pronunciation handling without changing the canonical manuscript meaning.

Do not alter publication prose just to influence TTS.

If a recurring proper-name pronunciation is materially wrong in Cedar:
- isolate the smallest production-only pronunciation override;
- document it;
- regenerate only affected chunks.

## QC

### Automated
- full track count expected;
- no zero-byte files;
- duration > plausible minimum;
- consistent sample rate/channels after mastering;
- loudness/peak/noise checks where measurable;
- manifest hashes;
- no source-file mutation;
- no secrets in repo;
- all files map to accepted track manifest.

### Human/operator
At minimum listen to:
- opening credits;
- first 2–3 minutes of every chapter;
- all chapter endings;
- all chapters containing pronunciation flags;
- all exercise sections;
- any regenerated/problem chunks;
- closing credits.

Founder does not need to listen to all 7 hours before package creation, but obvious defects must be fixed.

## Package

Prepare one sellable direct-download package locally.

Preferred:
`Psychical-Excursion-Audiobook-v1.zip`

Contents:
- chapter MP3 files in correct sortable order;
- opening/closing/front/back tracks as accepted;
- `README.txt`;
- `AI-NARRATION-DISCLOSURE.txt`;
- `SOURCE-NOTES.txt` or reference to source-note availability;
- optional cover placeholder only if already available/authorized; do not create cover art in this pass;
- package manifest with file hashes.

Disclosure must clearly state:
- narration is AI-generated using OpenAI Cedar;
- written by Jonathan Lee;
- AI narration is not a recording of Jonathan's natural voice.

Do not claim Audible/ACX distribution eligibility.

## Ebook relationship

Do not generate a new ebook file in this pass unless one already exists deterministically.
Package architecture should allow later:
- audiobook-only SKU
- ebook-only SKU
- audiobook + ebook bundle

## Delivery economics

Return:
- actual API request count;
- actual measured total duration;
- actual/estimated spend;
- total generation wall-clock time;
- retries/regenerations;
- final package size;
- founder/operator QC time if measured;
- effective production cost before payment processing.

Unknown remains unknown.

## Repo artifacts to commit

Commit only:
- production generator/tooling;
- manifests/receipts without secrets;
- hashes;
- package metadata;
- QC checklist;
- production receipt;
- direct-sale handoff document.

Do NOT commit:
- WAV/MP3/ZIP audio binaries;
- API keys;
- local paths containing secrets;
- billing account details.

## Direct-sale handoff

Produce `publication/audio/DIRECT-SALE-HANDOFF.md` with exact next requirements for the following pass:
- final local package filename/path;
- package SHA-256;
- package size;
- track count;
- runtime;
- AI disclosure copy;
- recommended product labels;
- whether audiobook-only + bundle should be offered;
- hosting/storage requirement;
- Stripe checkout/payment-link requirements;
- secure post-purchase delivery recommendation;
- homepage placement under **Read**;
- refund/support note;
- analytics event names without PII.

Do not activate checkout here.

## Acceptance criteria

Return a separate implementation PR containing:
- full-book generator;
- resumable cost-safe production pipeline;
- production receipt;
- package manifest/hashes;
- actual generation metrics if run;
- QC evidence;
- direct-sale handoff;
- full repo CI green.

If CloudDev cannot access the founder API key/audio workspace, it may complete tooling only and explicitly hand off execution to LaptopDev. Do not fabricate generation.

## Stop conditions

Stop and report if:
- cumulative conservative spend would exceed $15;
- API credits insufficient;
- Cedar quality degrades materially across long-form generation;
- repeated hallucination/truncation appears;
- production package cannot be verified;
- a new subscription or service is required;
- repo/source would need to store audio binaries;
- canonical prose would need substantive rewriting.

## Not authorized in this pass

- Stripe product/payment creation;
- public checkout;
- public deployment;
- homepage sale CTA;
- Audible/ACX upload;
- Spotify/Apple distribution;
- new subscription;
- hardware purchase;
- Chatterbox install/generation;
- human narrator;
- cover creation;
- ISBN action.

Do not merge.
Do not modify `pim-control`.
