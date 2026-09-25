# PEx Work Order — Local AI Narration Pilot / Direct-Sale Audiobook Path

## Baseline

Accepted audiobook-planning / Publication Master repository main:

`c2de1bdd95fcdd0d85ab38195f2bd0c9121e427f`

Accepted Web Edition source baseline remains:

`c969ebb5650e4f854b3d1a1284458a818eb71cfb`

Do not alter canonical Publication Master prose or the public website.

## Founder direction

Jonathan chooses the **direct-sale-first AI audiobook path**.

Business strategy:
1. produce the cheapest acceptable AI-narrated audiobook;
2. sell the ebook/audiobook directly on Psychical Excursion;
3. use collected sales evidence/profit to justify and fund broader human-narrated distribution later;
4. preserve the accepted human-narrated ACX path for a later edition;
5. test a free local clone of Jonathan's own voice if commercial licensing is clean;
6. otherwise use the cheapest acceptable stock AI narration, starting with OpenAI **Cedar**.

This pass is a **local pilot + production-tooling pass**, not full-book generation and not public launch.

## Two-lane pilot

Build a local narration comparison using the accepted Chapter 10 session script:

`publication/audio/session-scripts/10-watch-the-edge.md`

### Lane A — OpenAI Cedar

Use the OpenAI Speech API:
- model: `gpt-4o-mini-tts`;
- voice: `cedar`;
- output: WAV where supported;
- chunk at safe paragraph/section boundaries below API limits;
- preserve exact script order;
- configurable direction prompt for calm researched nonfiction;
- never send references/citations because the accepted session script already omits them.

Default voice direction should be restrained:
- conversational nonfiction;
- curious rather than mystical;
- warm but not "meditation app";
- mild humor preserved;
- clear technical terms;
- moderate pace;
- exercises slightly calmer but not whispered;
- no invented words or commentary.

API key:
- read only from an environment variable;
- never commit, print, log or persist it in repo;
- fail closed if missing.

Cost tracking:
- record request count, text characters/tokens where available, output duration and a conservative estimated API cost;
- do not generate the full book in this pass;
- pilot generation must have a hard cost ceiling configurable by the operator and default to a very small test budget (e.g. <= $1 unless founder explicitly changes it).

Current OpenAI docs list `cedar` and `marin` among the recommended high-quality voices for `gpt-4o-mini-tts`.
The model is currently priced by text/audio tokens; record actual usage/cost evidence where the API or billing output permits.
Do not hardcode an assumed full-book price as fact.

OpenAI policy/disclosure:
- plan direct-sale presentation so buyers are clearly told the audiobook uses an AI-generated voice.
- do not imply Jonathan personally performed the Cedar narration.

### Lane B — free local Jonathan voice clone

Primary candidate: official Resemble AI **Chatterbox**.

Re-prove before installation:
- official repository `resemble-ai/chatterbox`;
- exact current license file;
- exact model/checkpoint license(s), not merely repository wrapper code;
- commercial-use implications for generated output;
- local hardware requirements.

Current review at work-order creation:
- official Chatterbox repository is MIT licensed;
- Resemble describes Chatterbox as open source with zero-shot voice cloning;
- current README includes CPU-oriented Chatterbox Nano and other model variants.
These facts must be rechecked by LaptopDev against the exact model actually downloaded.

**Commercial-license gate:** do not use a local clone in the sellable audiobook unless the exact code + model/checkpoint + generated-output rights are verified as commercially compatible.

Do NOT substitute:
- Coqui XTTS-v2 for commercial production (current CPML path is non-commercial);
- F5-TTS public weights for commercial production (current public weights are CC-BY-NC);
- Fish Speech public weights for commercial production (current license requires a separate commercial agreement).

Those may be mentioned in research notes only; do not install them for this product.

## Jonathan reference voice

The local cloning lane may only clone **Jonathan's own voice**, with his explicit authorization already given in this founder direction.

LaptopDev should create a safe local capture/import workflow:
- accept one or more founder-owned reference WAV files;
- keep raw voice samples local and gitignored;
- never commit voice samples, embeddings, derived voice identity files or API secrets;
- document recommended clean sample length/quality;
- optionally record a short reference passage locally if tooling supports it;
- no cloud upload for the local clone lane.

If Chatterbox can produce a usable zero-shot clone from a short sample, render the same bounded Chapter 10 excerpt used for Cedar.

## Hardware detection

Before model installation:
- inspect OS;
- CPU;
- RAM;
- GPU vendor/model;
- GPU VRAM if available;
- free disk;
- Python environment.

Choose the smallest sensible Chatterbox variant that supports the test.

Prefer:
1. local GPU if compatible;
2. CPU-capable Chatterbox Nano / supported small model if quality is sufficient;
3. stop rather than destabilize the laptop or consume excessive disk/RAM.

Do not buy hardware.

## Pilot excerpt

Do not initially render the whole Chapter 10.

Create one representative excerpt target, roughly 3–5 minutes, containing:
- ordinary researched exposition;
- Jonathan-style humor;
- at least two technical terms;
- one reflective transition;
- a short exercise/instruction passage.

The selected text must remain verbatim from the generated Chapter 10 session script, except non-spoken HTML production cues may be removed.

Once the short samples work, the local tool may optionally allow the operator to generate full Chapter 10 later, but it must not do so automatically.

## Local Voice Lab

Build a small local-only comparison surface or CLI + HTML page.

Minimum capabilities:
- source excerpt shown once;
- audio players for each generated candidate;
- hide/provider-blind labels during listening if practical;
- record local scores for:
  - naturalness;
  - fit for Psychical Excursion;
  - Jonathan likeness (clone lane only);
  - pronunciation;
  - humor/timing;
  - calmness;
  - fatigue/listenability;
  - artifacts;
- free-text local notes;
- show generation metadata after scoring;
- never transmit scores/notes externally.

Candidates for first run:
1. OpenAI Cedar;
2. local Jonathan Chatterbox clone, if license/hardware gate passes.

Optional:
- OpenAI Marin as a third comparator only if the small pilot cost remains within the operator ceiling.
Do not widen to many paid providers.

## Audio normalization

For fair A/B:
- retain raw generated files;
- create normalized comparison derivatives using local deterministic tooling (FFmpeg if available);
- do not normalize so aggressively that provider artifacts are hidden;
- record source sample rate/format/duration;
- compare at equal perceived loudness as reasonably possible.

Do not master for retail yet.

## Reproducibility

Create:
- local configuration example with no secrets;
- generation manifest;
- exact provider/model/voice/instructions;
- exact source-script hash;
- chunk boundaries;
- output duration;
- generation timestamp;
- estimated/actual cost fields;
- local-clone model identity/license receipt;
- hardware receipt.

Gitignore:
- generated audio unless tiny fixture audio is explicitly justified;
- Jonathan reference voice;
- embeddings/model caches;
- API keys;
- local scoring database/results if personal.

Prefer metadata in repo, audio outside repo under a documented local workspace path.

## Production economics

Return a direct-sale production estimate for:
- full 63,509-word audiobook with OpenAI Cedar;
- full local Chatterbox clone if commercially permitted.

For Cedar:
- estimate using measured pilot duration/cost extrapolation;
- clearly label estimate;
- include regeneration/QC allowance.

For local clone:
- software/API cash cost may be $0, but report:
  - generation time;
  - hardware utilization;
  - disk use;
  - founder QC time;
  - electricity/compute as unallocated/unknown unless measured.

Unknown != zero.

## Direct-sale product boundary

Do not build checkout or publish audio in this pass.

Prepare a short launch requirements note for later:
- audiobook file/package;
- buyer download delivery;
- AI-voice disclosure;
- license/rights record;
- refund/customer-support considerations;
- ebook bundle option;
- direct-price experiment;
- analytics event plan within accepted privacy rules.

Existing payment tooling/Stripe may be considered later but no payment link or sale goes live here.

## Acceptance criteria

Return a separate implementation PR with:
- local Voice Lab code;
- hardware-detection path;
- Cedar API adapter;
- Chatterbox local adapter if license/hardware gate passes;
- safe secrets handling;
- voice-sample gitignore protections;
- representative excerpt selector;
- deterministic manifests;
- cost ceiling;
- local A/B interface;
- tests for chunking/script integrity/secrets/no-network local-score behavior;
- exact license receipt for Chatterbox model used;
- measured generation receipts if LaptopDev can execute locally;
- measured pilot costs/durations where actually generated;
- full-book cost extrapolation;
- direct-sale launch requirements note;
- full repo verification.

## Stop conditions

Stop and report rather than widening if:
- exact Chatterbox model/checkpoint commercial rights are ambiguous;
- model installation would exceed reasonable laptop resources;
- CUDA/Metal/CPU support is incompatible;
- an API/provider requires an unapproved subscription;
- Cedar pilot would exceed the hard cost ceiling;
- any generated audio deviates from the source text materially;
- secrets or reference voice would need to leave authorized local surfaces;
- full-book generation would begin.

## Not authorized

- full 23-chapter generation;
- public launch;
- checkout/payment activation;
- uploads to Audible/Spotify/Apple;
- new subscription;
- paid narrator;
- paid voice clone;
- voice cloning of anyone except Jonathan;
- new hardware purchase;
- production deployment;
- recurring cost.

Do not merge.
Do not modify `pim-control`.
