# PEx Work Order — Publication Master / Audio-First Book Edition

## Baseline

Accepted editorially complete web-book source:

`c969ebb5650e4f854b3d1a1284458a818eb71cfb`

## Founder direction

Jonathan wants Psychical Excursion to become:
- an ebook;
- a physical book if practical;
- an audiobook;
- later YouTube and/or podcast readings derived from the same audiobook material.

The existing website should stay as it is.

The book and audiobook may be adapted so the **final publishing edition works naturally when read aloud**.

## Product architecture

Create a separate **Publication Master** derived from the accepted 23-chapter web book.

The Publication Master becomes the canonical source for future:
1. ebook;
2. print book;
3. audiobook narration script;
4. YouTube/podcast read-through adaptations.

The website remains a distinct accepted **Web Edition** sourced from the existing `src/content/guidebook*.source.md` files. Do not mutate those files in this pass.

Do not create five independently edited manuscripts.

### One master, multiple renders

The publication prose should read naturally both:
- silently on a page; and
- aloud by a narrator.

Format-specific material should be separated from core prose:
- print/ebook citations/endnotes;
- audiobook narration notes;
- pronunciation guides;
- visual figure notes;
- production cues.

## Scope

Create a publication-manuscript structure in the implementation repository without changing public website behavior.

Preferred shape:

`publication/`
- `README.md` — provenance and edition rules
- `BOOK-MASTER.md` — assembled publication manuscript OR a deterministic manifest if individual chapter files are cleaner
- `chapters/` — 23 publication chapter files
- `front-matter/`
- `back-matter/`
- `audio/`
  - `NARRATION-GUIDE.md`
  - `PRONUNCIATION.md`
  - chapter cue/production notes if useful
- `references/` or equivalent endnote/reference structure

Choose a maintainable structure that minimizes duplicate prose.

## Core adaptation rule

The Publication Master should preserve the accepted meaning, voice, stories, research hierarchy, experiments, and chapter order.

Adapt only where necessary so the text works as a real book and reads naturally aloud.

### Spoken-friendly prose

Avoid prose that requires a screen or hyperlink to make sense.

Examples:

Web:
> Begin with [Relax the body](/body-scan-meditation/#nighttime-body-release).

Publication master should become something natural such as:
> Begin with the relaxation practice we called **Relax the Body**.

Do not add a numbered chapter callback unless truly useful.

Web:
> Follow this link...

Publication:
> Revisit the practice...

Never narrate a URL in ordinary prose.

### References and citations

The published book should retain research provenance.

The audiobook should not sound like:
> bracket three, D O I ten point...

Therefore separate the **reader-facing narrative** from reference mechanics.

Recommended model:
- print/ebook: superscript or unobtrusive endnote markers;
- chapter or book endnotes/references retain full source information;
- audiobook narration script omits citation numbers from spoken narration;
- audiobook may include a short standard line in front/back matter that full references are available in the ebook/print edition or accompanying notes;
- future YouTube/podcast descriptions can use the same source list.

Do not remove research support simply to make narration easier.

Do not fabricate or normalize incomplete references without source verification.

Known bibliography-normalization debt remains explicitly separate.

### Visual-only material

Audit every instruction that assumes the reader can see:
- the geometric attention object;
- Sky Clock;
- any graphic/diagram/interface;
- formatting-dependent layout.

For each, choose the smallest compatible solution:
1. make the prose self-sufficient for audio;
2. preserve an optional figure for print/ebook;
3. provide a narration alternative that does not require sight.

Example:
The geometric attention object may remain an optional figure in print/ebook, but the audio listener must still be able to perform the exercise from spoken instructions.

Do not create new scientific or mystical claims while adapting visuals.

## Front matter

Draft publication-ready front matter as separate editable source, including only what can be truthfully established now:

- Title: **Psychical Excursion**
- Author: **Jonathan Lee**
- short subtitle recommendation may be proposed but must not silently replace accepted titles/SEO naming;
- copyright placeholder or clearly marked metadata field rather than inventing registration;
- belief/evidence framing appropriate for a nonfiction book;
- sleep/safety note consistent with the manuscript;
- note that experiences and interpretations are explored without promising literal astral projection;
- edition/source note if useful.

Do not invent:
- ISBN;
- publisher/imprint;
- copyright registration number;
- endorsements;
- medical/legal credentials;
- publication date;
- retailer claims.

## Back matter

Prepare reusable back-matter structure for:
- acknowledgments placeholder;
- references/endnotes;
- about the author based only on authorized `knowledge/authorvoice.md` and accepted manuscript facts;
- website reference to Psychical Excursion if useful;
- optional “continue the experiment” closing language consistent with the book.

Do not add sales funnels or external claims.

## Audiobook narration architecture

Create a narration guide for the same Publication Master.

### Narration style

The voice should sound:
- curious;
- conversational;
- mildly amused when appropriate;
- precise around evidence;
- calm during exercises;
- never “mystical announcer”;
- never generic meditation-app whisper;
- never exaggerated paranormal certainty.

Preserve Jonathan's humor and rhetorical timing.

### Narration markup

Do not pollute the book prose with production directions.

If production cues are needed, keep them in separate audio metadata/notes.

Useful cue types may include:
- short pause;
- long pause;
- emphasis;
- pronunciation;
- chapter start/end;
- optional exercise silence;
- “do not read reference list aloud.”

Do not assume a specific TTS vendor or voice yet.

### Pronunciation guide

Create a first pronunciation lexicon for names/terms likely to be mishandled, such as:
- hypnagogia / hypnagogic;
- interoception;
- proprioception;
- vestibular;
- qigong;
- qi / chi;
- prana;
- Bön;
- Tenzin Wangyal Rinpoche;
- LaBerge;
- MILD;
- SSILD;
- WBTB;
- Falkor;
- any other recurring research names/technical terms encountered.

Use standard/common pronunciations where established. Flag uncertain proper-name pronunciation rather than inventing.

### Acronyms

Define how narration should read acronyms:
- MILD;
- SSILD;
- WBTB;
- REM;
- OBE;
- EEG;
- MEG;
- DOI (normally not spoken in narrative).

Choose natural spoken forms and document them.

## Chapter adaptation

Process all 23 chapters in order.

For each chapter:
1. derive from exact accepted web-edition source;
2. preserve substantive prose unless audio/page compatibility requires a bounded change;
3. remove/replace hyperlink-dependent wording;
4. ensure any visual instruction has an audio-complete alternative;
5. separate references from narration;
6. preserve Summary → Experiment → Intention logic;
7. preserve exact quoted affirmations and instructions;
8. record any text delta from web edition in an adaptation log.

## Exact protected text

Preserve exactly:

**My body sleeps. I remain aware. I recognize the transition and calmly enter.**

**I stay with the experience and explore before I explain.**

**Next time I am dreaming, I remember that I am dreaming.**

Do not paraphrase these for audio.

## Publication voice rule

The publication adaptation must not restart the earlier AI-harmonization problem.

Do not:
- smooth every sentence;
- add “audiobook voice” filler;
- create fake transitions;
- introduce repeated “as you heard earlier” callbacks;
- repeatedly say “in the previous chapter”;
- narrate formatting;
- over-explain headings;
- turn exercises into generic guided-meditation scripts unless the book already supports that tone.

The Publication Master should remain recognizably the accepted Jonathan manuscript.

## Web edition boundary

Do not alter:
- existing 23 web chapter source manuscripts;
- root homepage;
- site routes;
- sitemap;
- menu;
- analytics;
- styles;
- public rendering;
- SEO;
- held features.

This pass creates publication assets only.

## Deterministic provenance

Every publication chapter should identify its source web chapter and baseline commit in metadata or manifest.

Publication master provenance:
`c969ebb5650e4f854b3d1a1284458a818eb71cfb`

A future web edit must not silently mutate the publication edition.

A future publication edit must not silently mutate the web edition.

Changes between editions must be intentional.

## Output / return

Open a separate implementation PR and report:

- publication directory structure;
- exact provenance mechanism;
- word count for Publication Master;
- estimated narration word count excluding references/production notes;
- list of chapter-level adaptations;
- visual-only issues and how they were made audio-complete;
- front matter draft;
- back matter draft;
- pronunciation/acronym guide;
- audiobook narration rules;
- references/endnote strategy;
- any bibliography entries that remain source-verification debt;
- any adaptation that might be substantive enough to require founder review;
- confirmation public website files/behavior were unchanged;
- full repository verification result.

## Stop conditions

Stop and report rather than widening scope if:
- a necessary audiobook adaptation changes a scientific claim;
- a visual exercise cannot be made audio-complete without redesigning the exercise;
- a publication reference requires factual/source reconstruction;
- a new autobiographical detail would be needed;
- platform/vendor-specific requirements would force premature formatting decisions.

## Not authorized in this pass

- paid publishing accounts;
- ISBN purchase;
- ISBN assignment;
- KDP/ACX/Spotify/Apple/YouTube upload;
- cover design;
- audio generation;
- voice cloning;
- narrator hiring;
- contracts;
- pricing;
- publishing/distribution;
- print order;
- new recurring cost.

This pass prepares the reusable publication source first.

Do not merge.
Do not deploy manually.
Do not modify `pim-control`.
