# PEx Work Order — Book Harmonization Pass 2: Chapters 07–15

## Baseline

Implement from accepted main:

`0c4f4a0ea3424ff04dfb43c694e3e8e3277c01aa`

Pass 1 harmonized Chapters 01–06 against `knowledge/authorvoice.md` and the mature later book without homogenizing Jonathan's voice.

## Mission

Continue final-book editorial harmonization through the middle arc:

07 — Build the Current  
08 — Quiet the Mind  
09 — See the Image  
10 — Watch the Edge  
11 — Let the Body Sleep  
12 — Move Without Moving  
13 — Feel the Shift  
14 — Know the Threshold  
15 — Stabilize the Dream

The book should feel like one author developing one investigation, not separate AI-generated modules.

## Benchmark

Read:
- `knowledge/authorvoice.md`
- accepted Chapters 01–06 after Pass 1
- Chapters 16–23 as the mature later benchmark
- especially Chapter 23's sleep-first final routine

Preserve:
- Jonathan's curiosity, uncertainty, humor, personal experience, and occasional punchy short lines;
- evidence boundaries;
- practical experiments;
- chapter-specific texture.

Do not force every chapter into identical paragraph lengths or section patterns.

## Main continuity question

This middle run bridges:
**attention → sensation → stillness → imagery → hypnagogia → body receding → imagined movement → spontaneous movement → threshold recognition → stabilization**

Audit whether that progression is coherent, increasingly deep, and consistent with the final chapter's sleep-first routine.

## Four-part audit per chapter

### Voice
- Does it sound like Jonathan rather than an instructional template?
- Are rhetorical short lines intentional or default stacking?
- Is uncertainty natural, not performative?
- Is humor/personal detail preserved where real?
- Remove canned AI transitions, repeated thesis restatements, and generic “this is important” language.

### Research
- Verify substantive claims.
- Align sleep/hypnagogia/lucid-dream induction claims with the later evidence hierarchy.
- Distinguish:
  - established research;
  - plausible interpretation;
  - practitioner tradition;
  - personal experience;
  - open question.
- Do not overstate WBTB, sleep paralysis, vibration, “mind awake/body asleep,” or literal OBE claims.
- Add citations only when they materially improve rigor.
- Prefer primary research/systematic reviews/recognized academic sources.

### Structure/style
- Develop expository paragraphs where early drafting left stacked fragments.
- Preserve earned short lines in exercises, sensory sequences, humor, or threshold moments.
- Check transitions between chapters so each chapter can stand alone but the arc feels intentional.
- Summary → Experiment → Intention should feel earned.
- Remove repetition that later chapters already handle better.

### Whole-book continuity
- No old 60-day framing.
- No chapter-number callback clutter.
- Preserve actionable links only.
- Do not preview or promise outcomes the later book does not establish.
- Keep wording compatible with Chapter 23's sleep-protection rule and evidence hierarchy.

## Chapter-specific focus

### 07 — Build the Current
- directed sensation / “energy” framing;
- qi/prana/traditional models vs demonstrated physiology;
- Jonathan's actual felt-sensation model;
- avoid implying a literal current is established.

### 08 — Quiet the Mind
- focused attention vs open monitoring;
- mind-wandering / return;
- reality-check tie-ins only if useful;
- avoid meditation-as-magic framing.

### 09 — See the Image
- voluntary imagery vs spontaneous imagery;
- aphantasia differences;
- vividness vs usefulness;
- hypnagogic transition setup.

### 10 — Watch the Edge
- hypnagogia;
- autonomous imagery;
- sleep-onset phenomenology;
- sleep safety;
- creativity/problem-solving claims should be sourced and not folklore-heavy.

### 11 — Let the Body Sleep
- “mind awake, body asleep” as experiential shorthand, not sleep-stage diagnosis;
- REM atonia / sleep paralysis boundaries;
- no implication that paralysis is required;
- sleep-first safety.

### 12 — Move Without Moving
- motor imagery / kinesthetic imagery;
- dream movement;
- internally experienced movement vs physical action;
- keep language phenomenological where evidence is limited.

### 13 — Feel the Shift
- vestibular-motor sensations;
- self-location;
- vibration/buzzing/floating;
- no “vibrations required” implication;
- distinguish dramatic sensations from meaningful state transition.

### 14 — Know the Threshold
- mixed-state caution;
- false awakenings;
- state recognition;
- threshold as a cluster, not one signal;
- avoid pseudo-diagnostic certainty.

### 15 — Stabilize the Dream
- stabilization claims;
- lucidity vs stability vs control;
- distinguish practitioner techniques from experimentally established effects;
- align with later “explore before explain” philosophy.

## Anti-AI rules

Do not:
- rewrite everything into polished generic prose;
- overuse “not X but Y” constructions;
- repeat “the point is” / “this matters because”;
- add rhetorical questions mechanically;
- add vague profundity;
- make each chapter sound structurally identical;
- erase Jonathan-specific oddness;
- invent autobiography;
- increase citation count just to look researched.

A chapter may remain quirky if the quirk is human and intentional.

## Research / source discipline

Any new scientific or historical claim must be verified.

If evidence is weak:
- soften;
- attribute;
- or remove.

Do not fabricate citations.

Do not turn practitioner claims into research findings.

If a source conflicts materially with accepted later chapters, stop and report the conflict rather than silently rewriting the book's thesis.

## Preserve

- canonical titles/routes;
- 23-chapter numbering/menu;
- homepage;
- 24-URL sitemap;
- GA4/privacy;
- actionable Relax the body link;
- experiments unless evidence/safety warrants narrow wording;
- held-feature boundaries.

## Required return

For each chapter 07–15 report:
- voice assessment;
- research assessment;
- structural/style assessment;
- changes made;
- references added/removed;
- claims softened/strengthened;
- unresolved research gap.

Also report what Pass 3 should audit in Chapters 16–23 after comparing the whole book.

## Verification

Run:
- tests;
- lint;
- typecheck;
- build;
- package;
- verify:release;
- verify:canonical;
- verify:brand;
- verify:privacy.

Prove:
- titles/routes unchanged;
- no stale 60-day framing;
- no chapter-number callback clutter introduced;
- Summary → Experiment → Intention preserved;
- internal links remain valid;
- homepage/menu unchanged;
- sitemap remains 24;
- D-081 unchanged.

## Stop conditions

Stop and report if:
- research would materially reverse a chapter thesis;
- a personal-story edit needs Jonathan confirmation;
- fixing a chapter requires rewriting later chapters;
- evidence for a substantive new claim cannot be verified.

## Return

Open a separate implementation PR.

Do not merge.
Do not deploy manually.
Do not modify `pim-control`.
