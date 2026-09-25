# PEx Work Order — Audiobook Production Plan + Session-Script Pipeline

## Baseline

Accepted repository / Publication Master main:

`c08aa9c5265af96d7c7f8b38a1cd11a38653e858`

Accepted Web Edition source baseline remains separately pinned at:

`c969ebb5650e4f854b3d1a1284458a818eb71cfb`

Do not mutate the Web Edition.

## Founder direction

The audiobook is the next product step.

It should derive from the accepted Publication Master and later be reusable for YouTube/podcast readings without forking the prose.

This pass is **planning + deterministic session-script generation only**.

Do not synthesize or record audio yet.

## Mission

Create a production-ready audiobook plan and a deterministic chapter/session-script pipeline from the accepted Publication Master.

The output should make the next production decision small:

**Which narrator/voice path do we use, and do we approve a one-chapter audio pilot?**

## Required architecture

### Canonical source
- `publication/chapters/*.md` remains canonical publishing prose.
- Keep inline citation markers and chapter references in canonical publication source.
- Narration scripts suppress citation markers and reference lists at render time.
- No independent manual “audio manuscript” that can drift from the Publication Master.

### Session-script output
Create deterministic generated narration scripts under an audio-production directory, for example:

`publication/audio/session-scripts/`

One generated script per chapter, plus front/back matter scripts where appropriate.

Each script should:
- include spoken chapter number/title where appropriate;
- omit YAML;
- omit inline citation markers;
- omit `## References`;
- omit raw URLs/DOIs/PMIDs;
- preserve all substantive prose;
- preserve exact protected lines;
- normalize only formatting that would otherwise be spoken unnaturally;
- optionally include machine-readable or clearly non-spoken production cues that are unambiguous and removable.

Do not insert narrator commentary.

## Session-splitting plan

Assess whether each chapter can be one recording file/session.

Default: one chapter = one primary narration file.

If a chapter is materially long for reliable recording/editing, recommend bounded internal recording segments while keeping one final chapter track.

Use the accepted narration word counts to estimate duration at multiple natural nonfiction rates, e.g.:
- 135 wpm;
- 150 wpm;
- 165 wpm.

Return:
- total estimated raw narration duration;
- per-chapter estimated durations;
- longest/shortest chapter;
- which chapters merit internal session splits if any.

Do not promise exact runtime before real narration.

## Narrator / voice decision framework

Research and document three production paths without purchasing or enrolling:

1. **Jonathan narrates**
   - authenticity;
   - equipment/room/editing burden;
   - likely founder time;
   - correction workflow;
   - reuse rights obvious because it is his performance.

2. **Licensed synthetic narration**
   - only services whose terms permit commercial audiobook/podcast/YouTube use;
   - no voice cloning unless Jonathan later explicitly authorizes it;
   - identify current cost model, licensing, disclosure/platform constraints, export quality and editing workflow;
   - do not sign up or spend.

3. **Human narrator**
   - quality and performance upside;
   - likely cost/time/contract burden;
   - rights/reuse terms needed for audiobook + YouTube + podcast;
   - do not contact or hire.

Use current authoritative sources for any platform/service rules, pricing or technical requirements that may change.

Do not select a paid provider without founder approval.

## Strong default recommendation

The return may recommend a default **pilot path**, but it must be reversible and low-cost.

Prefer a one-chapter pilot before producing all ~63.5k narration words.

A recommendation should consider:
- Jonathan's desired authorial voice;
- production cost;
- founder time;
- consistency;
- commercial rights;
- ability to correct pronunciations;
- reuse on audiobook/YouTube/podcast;
- export quality;
- future platform compatibility.

## Pronunciation confirmation

Resolve as much as possible from authoritative or primary sources.

Priority names/terms:
- Tenzin Wangyal Rinpoche;
- Stephen LaBerge;
- Bön;
- qigong;
- dantian;
- hypnagogia / hypnagogic;
- interoception;
- proprioception;
- vestibular;
- MILD;
- SSILD;
- WBTB;
- REM/NREM;
- OBE;
- EEG/MEG.

Where a proper-name pronunciation remains uncertain:
- flag founder review;
- do not invent certainty.

Update `publication/audio/PRONUNCIATION.md` only where evidence supports a correction.

## Exercise-pause policy

Create a consistent rule for spoken exercises.

Differentiate:
- ordinary punctuation pause;
- short reflective pause;
- optional longer practice silence.

Do not turn the audiobook into a timed meditation app.

Do not add long silence that makes a normal audiobook awkward.

For exercises that genuinely benefit from silence, recommend one of:
- a brief natural pause in the main audiobook;
- an optional companion practice track later;
- spoken instruction such as “pause the audio here if you want more time.”

Do not change canonical book prose merely to solve production timing unless a concrete defect is found.

## Opening / closing credits

Draft reusable audio credits separately from canonical prose.

Include only facts known now:
- title: Psychical Excursion;
- author: Jonathan Lee;
- narrator placeholder until selected;
- edition/source-note language if useful;
- full-source-note availability statement.

Do not invent:
- publisher;
- ISBN;
- copyright registration;
- publication date;
- platform;
- producer;
- studio.

## Audio mastering / deliverable plan

Research current major audiobook distribution technical requirements and identify a safe production master that can be converted downstream.

At minimum investigate current specs/rules from authoritative sources for relevant distribution options such as:
- Audible/ACX where applicable;
- Spotify for Authors / Findaway distribution path if current;
- Apple Books audiobook delivery path if relevant;
- direct YouTube/podcast reuse needs.

Do not assume a platform that no longer operates under an old workflow.

Return a conservative production-master recommendation covering:
- sample rate;
- bit depth;
- mono/stereo;
- WAV archival master;
- lossy delivery derivative;
- peak/headroom;
- loudness/RMS where platform-specific;
- noise floor where platform-specific;
- chapter/file naming;
- intro/outro silence;
- metadata fields.

Separate:
- **archive/master spec**
from
- **platform delivery spec**.

## File naming

Define deterministic names, e.g.:

`PEX-AUDIO-01-what-is-a-psychical-excursion.wav`

Keep ordering sortable.

Account for front matter / opening credits / closing credits if separate.

## Production manifest

Create a machine-readable manifest for all planned tracks including:
- sequence;
- chapter number;
- title;
- source publication file;
- narration word count;
- estimated duration at selected planning WPM;
- pronunciation flags;
- exercise/pause flags;
- status placeholder;
- output basename.

No audio file hashes yet because no audio exists.

## Pilot recommendation

Choose one chapter for the first audio pilot.

Do not automatically choose Chapter 01 just because it is first.

Pick a chapter that is representative enough to test:
- Jonathan voice;
- research prose;
- humor;
- technical pronunciations;
- exercise pacing.

Explain why it is the best pilot.

The pilot must not be created in this pass.

## YouTube / podcast reuse

Design the session scripts so the same narration audio can later be reused without rerecording core prose.

Document:
- what extra intro/outro might be layered for YouTube/podcast;
- chapter source links/reference descriptions;
- artwork/video can be added separately;
- no platform-specific spoken calls-to-action should be baked into canonical audiobook audio.

## Cost / founder-time planning

Provide rough cost ranges and founder-time expectations for each narrator path based on current evidence.

Separate:
- one-time costs;
- recurring/service costs;
- founder recording/editing time;
- likely outsourcing cost.

Unknown is not zero.

No purchase.

## Website and publication boundaries

Do not alter:
- Web Edition;
- Publication Master chapter prose except a proven production defect;
- website routes;
- sitemap;
- menu;
- GA4;
- styles;
- SEO.

This pass may add:
- audiobook planning docs;
- deterministic narration render/session-script generator;
- generated session scripts;
- manifest/tests;
- pronunciation corrections supported by evidence.

## Verification

Run full repo CI.

Also verify:
- 23 chapter session scripts generated;
- each maps back to one publication chapter;
- exact protected lines survive;
- no inline citation markers in narration scripts;
- no References blocks in narration scripts;
- no raw DOI/PMID/URL narration leakage except intentionally spoken website/title material approved in front/back credits;
- word counts reconcile with Publication Master narration count within explained formatting differences;
- website/public source untouched.

## Return

Open a separate implementation PR and report:

- chosen recommended pilot chapter;
- narrator-path comparison and recommended default pilot path;
- current authoritative platform/mastering findings;
- total estimated audiobook runtime range;
- per-chapter/session plan;
- pronunciation status;
- exercise-pause policy;
- opening/closing credit drafts;
- generated script/manifest architecture;
- cost/founder-time comparison;
- YouTube/podcast reuse plan;
- any founder decisions required before audio generation;
- full CI.

## Stop conditions

Stop and report if:
- authoritative platform terms conflict materially;
- a commercial-rights question cannot be resolved;
- a pronunciation needs founder/personal confirmation;
- a narration adaptation would change meaning;
- a production choice would incur spend or create an account.

## Not authorized

- audio generation;
- recording;
- voice cloning;
- paid TTS;
- narrator hiring/contact;
- ACX/Audible/Spotify/Apple/KDP account actions;
- upload/publication/distribution;
- ISBN action;
- cover design;
- spend;
- external communication.

Do not merge.
Do not modify `pim-control`.
