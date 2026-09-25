# PEx Work Order — Book Harmonization Pass 1: Early Chapters

## Baseline

Implement from accepted main:

`ed94b32b430c0ba1920a2f642d084399ed9a691f`

This baseline includes the founder-approved homepage/menu corrections and cross-reference cleanup from implementation PR #79.

## Mission

Psychical Excursion is now being finalized as a future book.

Jonathan's direction:

> make sure my early chapter match my later chapter in voice and research and style. the early chapters were written before the final chapter so there may not be consistancy. i want the overall book to feel like it was written by same author and not ai. we can take multiple passes if needed.

This is **not** a generic rewrite and not permission to homogenize the book.

The goal is one coherent human authorial voice across the completed 23-chapter journey.

## Editorial benchmark

Read first:
- `knowledge/authorvoice.md`
- Chapter 01 — What Is a Psychical Excursion?
- Chapters 16–23, especially:
  - Explore the Dream
  - Loosen the Body
  - Cross the Threshold
  - Test the Experience
  - Compare the Maps
  - Floating in Space
  - Notice the Coincidence
  - Return. Record. Repeat

Use the later chapters as the **maturity benchmark**, not a template to copy mechanically.

The mature PEx voice is:
- curious before certain;
- researched but conversational;
- skeptical without making skepticism the subject;
- open to mystical/traditional models without adopting them as scientific fact;
- Jonathan as fellow experimenter, not guru;
- comfortable with “maybe,” “I don't know,” and genuine open questions;
- mild human humor where it naturally belongs;
- specific personal experience when Jonathan actually has one;
- developed prose paragraphs for exposition;
- occasional short lines only when they earn rhetorical emphasis;
- practical experiment before ontology;
- evidence boundary stated when a claim could otherwise be overread;
- no “AI explainer” voice, canned transitions, repetitive summary language, or false certainty.

## Preliminary audit finding

The earliest source material was written under an older editorial style.

In particular, the opening dream/body/attention material contains substantially more stacked short-line prose and a lighter explicit research apparatus than the later research-rich chapters.

This creates a visible seam in the book.

Do not solve this by removing all short lines. Jonathan's voice legitimately uses short lines for humor, emphasis and rhythm.

Solve it by distinguishing:
- **intentional punch** from
- **default sentence stacking**.

Later chapters may also contain short sequences, especially in exercises and rhetorical moments. Preserve those where they sound deliberate.

## Scope — Pass 1

Audit and revise only the first six book chapters:

### Chapter 01
**What Is a Psychical Excursion?**
Source:
`src/content/guidebookManuscript.source.md`

### Chapter 02
**Remember Your Dreams: Dream Recall Techniques and Research**
Source:
`src/content/guidebookChapter01.source.md`

### Chapter 03
**Notice Your Dreams: Dream Awareness, Patterns and Dream Signs**
Source:
`src/content/guidebookChapter02.source.md`

### Chapter 04
**Recognize the Dream: Lucid Dreaming, Reality Checks and Dream Signs**
Source:
`src/content/guidebookChapter03.source.md`

### Chapter 05
**Feel the Body: Body Scan Meditation and Deep Relaxation**
Source:
`src/content/guidebookChapter04.source.md`

### Chapter 06
**Move Your Attention: Focused Attention and Body Awareness Meditation**
Source:
`src/content/guidebookChapter05.source.md`

Do not edit Chapters 07–23 in this pass except for a strictly necessary shared renderer/test adjustment.

## Four-part audit for each chapter

### 1. Voice continuity

Ask:
- Does this sound like Jonathan in `knowledge/authorvoice.md`?
- Does first-person material correspond to actual documented author experience?
- Is the narrator a curious participant rather than an omniscient teacher?
- Is humor human and occasional?
- Are uncertainty and wonder balanced naturally?
- Does the prose avoid generic AI formulations such as:
  - “This is important because...”
  - repetitive “The point is...”
  - repetitive “Here is where...”
  - excessive binary contrast templates;
  - fake profundity;
  - canned inspirational conclusions?
- Are short one-line paragraphs serving rhythm or merely fragmenting ordinary exposition?

Preserve Jonathan-specific stories and language whenever possible.

Do not invent new autobiographical details.

### 2. Research continuity

For each substantive scientific/historical claim:
- identify whether the existing chapter actually supports it;
- distinguish established evidence, plausible interpretation, tradition, personal experience and open question;
- add or strengthen citations where the early chapter is materially weaker than later chapters;
- prefer peer-reviewed primary research, systematic reviews, recognized academic/reference works and authoritative institutional sources;
- verify changing or easily misremembered claims before adding them;
- do not cite a source merely because it sounds relevant;
- do not add citation volume for decoration.

Research should improve the reader's understanding, not turn an accessible chapter into a literature review.

Where the evidence is mixed, say so.

Where the book is making a practice suggestion rather than a demonstrated causal claim, make that distinction clear.

### 3. Structural/style continuity

Later chapters generally work because they move through:
**question / lived problem → research or map → practical meaning → experiment → observation → open question**

The early chapters do not need identical section counts, but should feel compatible with that logic.

Audit:
- opening strength;
- paragraph development;
- heading usefulness;
- repeated sentence fragments;
- unnecessary repetition;
- abrupt transitions;
- overlong lists;
- explanatory passages that are too thin;
- conclusions that sound generic;
- whether Summary → Experiment → Intention feels earned rather than appended.

Preserve the accepted ending structure:
**Summary → Experiment → Intention → References** where references exist/are added.

### 4. Book continuity

Because the whole book now exists:
- ensure early promises accurately match what the later book actually does;
- do not preview held or removed product features;
- do not resurrect the old fixed 60-day framing;
- keep the book's current 23-chapter conception;
- do not add chapter-number callbacks merely for sequence; the reader menu handles sequence;
- preserve useful actionable internal links;
- avoid promising later scientific certainty the book does not deliver.

## Chapter-specific goals

### Chapter 01 — What Is a Psychical Excursion?

This chapter was recently completion-audited and already contains important Jonathan voice.

Treat it conservatively.

Preserve:
- I Want Psychic Super Powers;
- lucid-flight stories;
- qigong/body-attention history;
- conscious-while-snoring story;
- RAW/model-agnostic framing;
- No Grades, No Gurus;
- Let's see what happens;
- completion-aware What This Book Actually Does section.

Audit mainly for:
- cadence consistency;
- accidental repetition;
- research/evidence wording;
- transitions into the finished book;
- any remaining legacy framing.

Do not turn it into an academic introduction.

### Chapter 02 — Remember Your Dreams

Make this feel like a researched opening skill chapter, not a preliminary app lesson.

Strengthen where justified:
- dream recall and forgetting;
- immediate recording;
- awakenings and recall opportunity;
- sleep/dream memory limitations;
- what dream journaling can reasonably be said to do.

Do not claim dream journaling guarantees recall improvement unless evidence supports the wording.

Preserve practical accessibility: a few words can be enough.

### Chapter 03 — Notice Your Dreams

Audit:
- dream signs;
- recurring themes/patterns;
- continuity between waking concerns and dreams;
- frequency/salience effects;
- distinction between noticing patterns and assigning metaphysical meaning.

Keep it curious, not clinical.

### Chapter 04 — Recognize the Dream

Audit:
- reality testing/checks;
- prospective memory;
- metacognition/lucidity;
- state-checking practices;
- evidence for induction versus internet folklore.

This chapter should align with the later MILD/prospective-memory discussion in Chapter 23 without prematurely duplicating it.

### Chapter 05 — Feel the Body

Audit:
- body-scan meditation;
- relaxation;
- interoception/body awareness;
- sleep-compatible relaxation;
- safety and non-force.

Keep the practice useful even if nothing unusual happens.

### Chapter 06 — Move Your Attention

This chapter contains distinctive Jonathan material about directed bodily sensation.

Preserve his actual experience and working model.

Audit:
- attentional modulation of sensation;
- body maps/interoception/somatosensory attention where relevant;
- distinction between felt “energy” and claims about a literal energy substance;
- historical/traditional terms only with accurate framing;
- whether the spine/kundalini material is appropriately bounded if present.

Do not medicalize ordinary practice and do not turn Jonathan's subjective experience into scientific proof.

## Anti-AI editorial rules

Do not:
- make every chapter use the same paragraph length;
- force every section into the same rhetorical template;
- add generic poetic lines merely for atmosphere;
- add rhetorical questions every few paragraphs;
- replace Jonathan's odd/funny specificity with polished generic prose;
- overuse em dashes, “not X but Y,” “both/and,” or symmetrical triads;
- restate the chapter thesis after every section;
- use “journey,” “unlock,” “deeper,” “powerful,” “profound,” “transformative,” or similar filler unless concretely earned;
- make every paragraph sound maximally polished.

A human book can have texture.

The goal is coherence, not sterility.

## Research safety / provenance

Any new substantive claim must be sourced.

If high-quality evidence cannot be found:
- keep the claim explicitly tentative;
- attribute it to a tradition/practitioner source where appropriate;
- or remove it.

Do not fabricate citations.

Do not replace a primary/academic source with an SEO blog.

Do not turn correlations into causes.

Do not imply evidence for literal astral travel where none is established.

## Personal voice provenance

Use `knowledge/authorvoice.md` as the only authorized source for new Jonathan-specific first-person detail.

Existing manuscript first-person content may remain if already accepted.

If a proposed first-person detail cannot be tied to authorvoice or accepted manuscript history, do not add it.

## Change discipline

This pass can rewrite prose where needed, but preserve:
- chapter canonical titles;
- routes;
- SEO metadata;
- 24-URL sitemap;
- 01–23 menu;
- homepage;
- menu behavior;
- GA4/privacy;
- experiments unless evidence/safety requires a bounded wording correction;
- existing personal stories;
- all held-feature boundaries.

Do not silently change the book's core claims.

If a chapter would need major conceptual restructuring, flag it rather than performing an uncontrolled rewrite.

## Required audit return

For each of Chapters 01–06, report:
- voice assessment;
- research assessment;
- structural/style assessment;
- what changed;
- new/removed references;
- any claim softened or strengthened and why;
- unresolved research gap.

Also provide a brief cross-book diagnosis identifying what should be audited in Pass 2.

## Verification

At minimum:
- all six chapters parse/render;
- accepted chapter titles/routes unchanged;
- no public PEx shorthand;
- no stale fixed 60-day framing introduced;
- no chapter-number callback clutter introduced;
- Summary → Experiment → Intention ordering preserved;
- references render and DOI/URLs are validly structured;
- existing actionable internal links remain;
- homepage/menu/root behavior unchanged;
- sitemap stays 24;
- D-081/privacy unchanged;
- full tests/lint/typecheck/build/release/canonical/brand/privacy pass.

## Stop conditions

Stop and report rather than widening scope if:
- research would materially change a chapter's central thesis;
- a personal-story change needs Jonathan confirmation;
- a source conflicts materially with an accepted later chapter;
- a rewrite would require changing Chapters 07–23 to make sense;
- citation verification is unavailable for a substantive new claim.

## Return

Open a separate implementation PR.

Do not merge.
Do not deploy manually.
Do not modify `pim-control`.
