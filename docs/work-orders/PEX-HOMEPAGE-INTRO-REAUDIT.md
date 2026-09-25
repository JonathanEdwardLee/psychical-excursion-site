# PEx Work Order — Homepage Mandala + Introduction Re-audit

## Baseline

Implement from accepted main:

`00b660c29117687cf7eb91b9aa73588ffe6484d7`

The 23-section guidebook source sequence is complete at this baseline.

Jonathan's new founder direction:
- the website homepage should open with the existing animated mandala / Chapter 5 attention instrument;
- below it, centered small text should read exactly:
  **My body sleeps. I remain aware. I recognize the transition and calmly enter.**
- below that, provide an elegant book-entry link with a short synopsis and the same editorial arrow language used by chapter navigation;
- that link leads to the existing introduction page;
- re-audit the introduction now that the full book journey is complete.

## Product intent

The root homepage becomes a minimal visual threshold into the book.

The homepage is not a second introduction, marketing funnel, dashboard, course landing page, or feature menu.

Its job:
1. create immediate visual identity with the already-accepted animated mandala;
2. present the book's core affirmation quietly;
3. give one elegant action: enter the book.

The introduction at `/psychical-excursion/` remains the literary opening to the guidebook.

## Architecture correction

Current source treats `/psychical-excursion/` as both the public "home" and the introduction, with root canonicalization/redirect behavior sending visitors there.

This pass separates those concepts.

### Root homepage

Canonical path:

`/`

Root must render a real static/crawlable homepage artifact and must not immediately canonicalize/redirect to `/psychical-excursion/`.

### Introduction

Canonical path remains:

`/psychical-excursion/`

Do not change this URL.

The introduction remains the first book section and the previous-reading destination for Chapter 1.

### Catalog / sitemap

Add the root landing page as a distinct catalog/static page without renumbering or changing the 23 guidebook section IDs.

Expected canonical sitemap count after this pass:

**24 URLs total = homepage + 23 guidebook pages.**

No hash URLs in sitemap.

Preserve legacy root/hash compatibility sensibly while making the canonical root a first-class page.

## Homepage design

Reuse the existing exact mandala code:

`renderAttentionInstrument()`

Do not redraw, approximate, simplify, or create a second mandala implementation.

Reuse its existing animation timings, geometry, theme behavior, and reduced-motion fallback.

### Composition

Within the existing compact guidebook shell/header:

1. Large centered mandala as the dominant first-screen object.
2. Directly below, centered small quiet text:
   **My body sleeps. I remain aware. I recognize the transition and calmly enter.**
3. Below that, a restrained editorial book-entry block.
4. No additional homepage sections, feature cards, testimonials, pricing, account prompts, progress UI, donation asks, social proof, or marketing clutter.

The first view should feel calm, strange, precise, and unmistakably Psychical Excursion.

### Mandala treatment

- Use the same actual instrument code and SVG.
- Homepage may apply a wrapper/layout class to make it larger and centered than its in-chapter use.
- Preserve aspect ratio.
- No rapid motion, flicker, glow effects, particle effects, parallax, or new animation.
- Reduced-motion must remain static.
- Must not create horizontal overflow on mobile.
- Keep performance cost minimal by reusing existing code/CSS.

### Affirmation treatment

Exact visible text:

**My body sleeps. I remain aware. I recognize the transition and calmly enter.**

Presentation:
- centered;
- small;
- elegant;
- quieter than the book-entry title;
- readable in both themes;
- no quotation marks;
- no animation required.

### Book-entry link

Use the singular project/book name consistently:

**Read Psychical Excursion**

The entire editorial entry may be one accessible link or contain one clearly dominant accessible link.

Suggested synopsis copy, preserve exactly unless a tiny punctuation normalization is required:

**A researched, practical journey through dream recall, attention, lucid dreaming, sleep-edge states, out-of-body experience, verification, strange coincidences, and the question of how far consciousness can go.**

Visual language:
- centered or compositionally balanced under the affirmation;
- typography/spacing first, not a generic card;
- use an elegant right arrow consistent with existing next-reading links;
- no button chrome unless accessibility requires it;
- hover/focus state must be obvious;
- destination: `/psychical-excursion/`.

Preferred visible link line:

**Read Psychical Excursion →**

## Introduction re-audit

The current introduction has strong voice and personal material and should not be discarded.

Preserve its:
- curious / model-agnostic posture;
- "I Want Psychic Super Powers" section and humor;
- lucid-dream flight stories;
- qigong/body-awareness story;
- conscious-while-snoring story;
- RAW influence;
- research/tradition distinctions;
- "No Grades, No Gurus" spirit;
- final "Let's see what happens." tone.

The audit is a **completion-aware refinement**, not a wholesale rewrite.

### Required introduction edits

#### 1. Add the completed journey early

Immediately after:

> The goal is to learn enough, practice enough, and pay enough attention that we have something more interesting to work with than an opinion.

add:

> The route is practical. We begin by remembering dreams and training attention, then move through body awareness, visualization, hypnagogia, lucid dreaming, altered self-location, out-of-body techniques, verification, competing explanations, the larger sky we are already floating through, strange coincidences, and finally a repeatable nightly practice.

Then add:

> You do not need to believe the same thing at the end that you believed at the beginning. You only need to become a better observer of your own experience.

#### 2. Add a completion-aware section before "No Grades, No Gurus"

Insert:

## What This Book Actually Does

Each section takes one piece of the larger question and slows it down enough to examine.

We will look at research where research can answer something.

We will look at historical, religious, occult, and contemplative traditions when they offer useful maps.

We will practice.

We will record what happens.

And when a claim becomes testable, we will try to make the test cleaner rather than the story bigger.

The book gradually moves from ordinary skills toward stranger territory.

Dream recall becomes dream recognition.

Body awareness becomes altered self-location.

Visualization becomes autonomous imagery.

Lucid dreaming becomes a laboratory.

Out-of-body techniques become something we can compare with lucid dreaming, sleep paralysis, and body-schema research.

The Sun, Moon, planets, synchronicity, recurring places, and shared-dream reports become things to investigate without granting them automatic authority.

At the end, the many techniques collapse back into one repeatable practice.

The point is not to collect twenty-three beliefs.

The point is to become more skillful at noticing what consciousness actually does.

#### 3. Make "The Excursion" completion-aware

Replace:

> And if we eventually reach the strange collection of techniques people have used to attempt out-of-body experiences?
>
> We'll try those too.

with:

> When we reach the strange collection of techniques people have used to attempt out-of-body experiences, we'll try those too.

Preserve:

> Carefully.
>
> Curiously.
>
> Without pretending beforehand that we know what the result means.

#### 4. Add one line near the end of "The Excursion"

Immediately before:

> I hope that by the end of this excursion you discover more about yourself...

add:

> By then, you will also have a way to test unusual experiences, compare competing maps, notice recurring patterns without surrendering to them, and return to one simple nightly routine.

#### 5. Preserve evidence claims unless separately verified

Do not add new scientific claims during this editorial re-audit.

Keep all five current introduction references unless an existing citation becomes invalid due to the text edits.

No new reference is required by the completion-aware additions because they describe the book's own contents, not external facts.

## SEO / metadata

Root homepage:
- unique title and meta description;
- canonical `https://psychicalexcursion.com/`;
- truthful concise description centered on the free researched guidebook;
- do not make the homepage H1 compete visually with the mandala if a visually hidden semantic H1 or similarly accessible solution better preserves the founder's visual intent;
- do not hide meaningful text from assistive technology.

Introduction:
- preserve canonical `/psychical-excursion/`;
- preserve accepted SEO title **Psychical Excursion: Lucid Dreaming, Meditation, Visualization & OBE Research** unless a technical architecture reason requires metadata separation;
- visible introduction title remains **What Is a Psychical Excursion?**

## Navigation behavior

- Root book-entry link → `/psychical-excursion/`.
- Introduction next-reading remains Chapter 1.
- Chapter 1 previous-reading remains Introduction, not root homepage.
- The book reading chain therefore remains Introduction → Chapter 1 → … → Return. Record. Repeat.
- Brand/header behavior may still link to root if that is the clearest site-home convention, but do not disrupt the book's previous/next chain.
- Browser Back/Forward and direct deep links must remain correct.

## Analytics / privacy

Preserve D-081.

Root page view may be measured as canonical `/`.

Do not add:
- new events;
- private data;
- precise location;
- form values;
- user identifiers;
- ad personalization.

Introduction and chapter analytics behavior must not regress.

## Design / accessibility / performance

Follow `knowledge/design`:
- hierarchy before decoration;
- one distinctive visual idea (the mandala);
- continuous surface;
- responsive recomposition;
- visible keyboard focus;
- reduced motion;
- 200% zoom resilience;
- no horizontal overflow;
- touch-safe link target;
- no CLS caused by the mandala;
- no new fonts, libraries, images, or third-party scripts;
- no new recurring cost.

The existing >500 kB JS warning remains tracked debt. This pass must not materially worsen it merely to build the landing page.

## Verification

At minimum prove:

### Homepage
- direct root request produces a real static root page and does not redirect/canonicalize to introduction;
- root canonical metadata points to `https://psychicalexcursion.com/`;
- exact existing attention instrument is reused;
- homepage mandala renders once;
- reduced-motion produces static instrument;
- exact affirmation appears once;
- visible **Read Psychical Excursion →** link exists and points to `/psychical-excursion/`;
- exact synopsis copy present;
- no chapter manuscript dumped onto root;
- no held features;
- mobile/narrow layout does not overflow.

### Introduction
- canonical path remains `/psychical-excursion/`;
- visible title remains **What Is a Psychical Excursion?**;
- five required editorial changes are present;
- five existing references remain;
- Chapter 1 next-reading remains correct;
- Chapter 1 previous-reading still points to Introduction;
- no public chapter number.

### Whole site
- sitemap contains 24 HTTPS canonical URLs and no hashes;
- all 23 guidebook section routes remain unchanged;
- **Floating in Space** remains intact;
- final Return. Record. Repeat route remains intact;
- GA4 canonical path fires once per public page;
- robots, PWA, honest 404 behavior, Chapter 4 deep link, Chapter 5 instrument, reduced motion, privacy and release verification remain green.

Run the full CI/release suite.

## Return

Open a separate implementation PR and report:
- PR / branch / head / baseline;
- root homepage architecture and canonical metadata;
- proof exact mandala code is reused;
- introduction diff summary;
- sitemap count;
- navigation regression;
- analytics/privacy regression;
- responsive/reduced-motion verification;
- full CI/release result;
- bundle-size effect;
- unresolved issues.

Do not merge. Do not deploy manually. Do not modify `pim-control`.
