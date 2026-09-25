# PEx Work Order — Homepage / Menu Corrections + Chapter Cross-Reference Audit

## Baseline

Implement from accepted main:

`8330db5903fd71fa732ddbeda5f303deafd0d2d0`

Founder verified this accepted state live in production on 2026-09-24.

This is the first pass of the founder's broader full-text audit. Scope this pass to:
1. two visual corrections;
2. explicit chapter cross-reference correctness and linking.

Do not expand into a general prose rewrite yet.

## Founder corrections

### 1. Homepage spacing / hierarchy / book-entry order

Current root homepage `/` has the correct mandala, affirmation, synopsis and book-entry destination, but adjust the composition.

Required visible order:

1. animated mandala;
2. more breathing room;
3. exact affirmation:
   **My body sleeps. I remain aware. I recognize the transition and calmly enter.**
4. more breathing room;
5. **Read Psychical Excursion →**
6. the accepted short synopsis beneath the link:
   **A researched, practical journey through dream recall, attention, lucid dreaming, sleep-edge states, out-of-body experience, verification, strange coincidences, and the question of how far consciousness can go.**

Requirements:
- affirmation must be clearly smaller than normal book/body text;
- keep it centered and quiet;
- increase spacing between mandala and affirmation;
- increase spacing between affirmation and book-entry group;
- the **Read Psychical Excursion →** line comes before the synopsis;
- synopsis remains subordinate to the link/title line;
- preserve the exact mandala component/code and reduced-motion behavior;
- preserve root canonical metadata, GA4 and responsive behavior;
- do not add another homepage section or marketing element.

Use typography and spacing, not cards/shadows/gradients, per `knowledge/design`.

### 2. Reader-menu icon correction

The menu itself is founder-approved and should remain unchanged in structure and behavior.

Only correct the closed/open trigger mark.

Current problem:
- the geometric mark reads as a tiny symbol contained inside a square/button.

Founder intent:
- the symbol itself should feel like a geometric sigil/instrument;
- enlarge the geometry substantially;
- its lines should visually cross/intersect the square relationship instead of sitting timidly inside it;
- it should read as one integrated geometric symbol, not “small icon inside square.”

Implementation guidance:
- preserve the current touch target/button hit area, focus state, `aria-expanded`, labels and menu behavior;
- do not reduce the touch target to make the icon larger;
- use only CSS/SVG geometry already consistent with the PEx visual language;
- no new asset;
- no glow, fill-heavy icon, hamburger, Material-style FAB or decorative animation;
- preserve light/dark contrast;
- reduced-motion behavior unchanged;
- ensure SVG geometry is not clipped when lines extend/cross.

The chapter menu panel/list is already accepted as visually successful. Do not redesign it.

## Canonical chapter numbering

The book is exactly 23 chapters:
- `01` = **What Is a Psychical Excursion?**
- `02` = Remember Your Dreams
- ...
- `23` = Return. Record. Repeat

For prose cross-references:
- do not write “Chapter 10”;
- write the linked number only, e.g. `[**10**](/hypnagogia-lucid-dreaming/)` where appropriate in sentence context;
- use two-digit numbers `01`–`23`;
- every specific cross-reference number must be a real link to the canonical route;
- no hash-only legacy destination;
- if a sentence refers to the current chapter itself, prefer **this chapter** rather than a self-link;
- generic non-specific phrases such as “earlier chapters,” “several chapters,” or “later chapters” may remain when they intentionally do not identify one destination.

## Cross-reference audit findings and required corrections

The old manuscripts were authored while the opening was treated separately, so explicit old chapter numbers are no longer reliable. Correct by semantic target, not blind string replacement.

### Current Chapter 04 — Recognize the Dream
Source: `src/content/guidebookChapter03.source.md`

Old:
> Fortunately, Chapter 2 gave us plenty.

Target is current Chapter **03** — Notice Your Dreams at `/dream-awareness-signs/`.

Rewrite naturally so **03** is linked. Preferred:
> Fortunately, we found plenty of them in [**03**](/dream-awareness-signs/).

### Current Chapter 05 — Feel the Body
Source: `src/content/guidebookChapter04.source.md`

Old self-reference:
> So Chapter 4 really begins two practices.

This is the current page. Replace with:
> So this chapter really begins two practices.

No self-link.

### Current Chapter 06 — Move Your Attention
Source: `src/content/guidebookChapter05.source.md`

Specific references:

Old:
> In the last chapter we learned that deliberately attending to the body can make normally quiet sensations more noticeable.

Target current **05** `/body-scan-meditation/`.

Use:
> In [**05**](/body-scan-meditation/), we learned that deliberately attending to the body can make normally quiet sensations more noticeable.

Old:
> When you are ready for sleep, [**Relax the body**](#/feel-the-body#nighttime-body-release) using the Chapter 4 practice.

Keep the useful deep link to the relaxation section, but correct the prose reference to current **05** and make the numbered reference canonical/clickable. Preferred:
> When you are ready for sleep, [**Relax the body**](/body-scan-meditation/#nighttime-body-release) using the practice from [**05**](/body-scan-meditation/).

Old:
> In Chapter 1, we turned attention backward toward dreams that were disappearing.

Target current **02** `/dream-recall/`.

Old:
> In Chapter 2, we turned attention toward unusual details.

Target current **03** `/dream-awareness-signs/`.

Old:
> In Chapter 3, we attached attention to recognition.

Target current **04** `/lucid-dreaming-reality-checks/`.

Old:
> In Chapter 4, we turned attention inward toward the body.

Target current **05** `/body-scan-meditation/`.

Rewrite each as **In [02]...**, **In [03]...**, **In [04]...**, **In [05]...** using bold linked two-digit numbers.

Leave generic phrases like “a later chapter” or “several chapters” alone unless implementation context proves they name one exact target.

### Current Chapter 07 — Build the Current
Source: `src/content/guidebookChapter06.source.md`

Old:
> In the last chapter, we moved attention.

Target current **06** `/attention-body-awareness/`.

Old:
> That will become important in the next chapter.

Target current **08** `/meditation-for-lucid-dreaming/`.

Old:
> We began Chapter 4 by feeling the body.

Target current **05** `/body-scan-meditation/`.

Old:
> In Chapter 5 we made attention mobile.

Target current **06** `/attention-body-awareness/`.

Replace with natural sentences using linked **06**, **08**, **05**, **06** respectively.

### Current Chapter 08 — Quiet the Mind
Source: `src/content/guidebookChapter07.source.md`

Old:
> Chapter 6 used movement itself as the exercise.

Target current **07** `/energy-sensations-meditation/`.

Preferred:
> In [**07**](/energy-sensations-meditation/), movement itself was the exercise.

Old self-number:
> ...because Chapter 7 is ultimately about...

This is the current page, Chapter 08. Replace the numbered self-reference with **this chapter**; do not self-link.

Generic “last few chapters,” “previous chapters,” and “next stages” language may remain.

### Current Chapter 10 — Watch the Edge
Source: `src/content/guidebookChapter09.source.md`

All three explicit “Chapter 8” references point to current **09** — See the Image at `/visualization-hypnagogic-imagery/`.

Rewrite:
- “Chapter 8 separated...” → “In [**09**](...), we separated...”
- “This is an important transition from Chapter 8.” → link **09**
- “The same distinction from Chapter 8 applies.” → link **09**

Old:
> This resembles the fragile imagery from the previous chapter...

Target current **09**. Replace the relative reference with linked **09** while preserving the rest of the sentence.

Generic “previous chapters” plural may remain.

### Current Chapter 11 — Let the Body Sleep
Source: `src/content/guidebookChapter10.source.md`

Two specific “next chapter” references target current **12** — Move Without Moving at `/motor-imagery-lucid-dreaming/`.

Replace each with linked **12**, preserving sentence meaning.

### Current Chapter 12 — Move Without Moving
Source: `src/content/guidebookChapter11.source.md`

Old:
> The previous chapter examined...

Target current **11** `/mind-awake-body-asleep/`.

Old:
> Think back to the previous chapter.

Target current **11**.

Old:
> In Chapter 8 we learned not to score imagery only by brightness.

Target current **09** `/visualization-hypnagogic-imagery/`.

Replace with linked **11**, **11**, and **09** respectively.

### Current Chapter 13 — Feel the Shift
Source: `src/content/guidebookChapter12.source.md`

Old:
> The previous chapter practiced intentional movement...

Target current **12** `/motor-imagery-lucid-dreaming/`.

Replace with linked **12**.

Generic plural references to earlier/later/preceding chapters may remain.

### Current Chapter 14 — Know the Threshold
Source: `src/content/guidebookChapter13.source.md`

Old:
> Chapter 12 asked which part of experience shifts first.

Target current **13** `/out-of-body-sensations-sleep/`.

Replace with linked **13**.

Old:
> The next chapter will deal with that problem.

Target current **15** `/lucid-dream-stabilization/`.

Replace with linked **15**.

### Current Chapter 16 — Explore the Dream
Source: `src/content/guidebookChapter15.source.md`

Old:
> The previous chapter separated lucidity, stability, and control.

Target current **15** `/lucid-dream-stabilization/`.

Replace with linked **15**.

Generic “earlier chapters” language may remain.

## Audit rule for any additional findings

During implementation, scan all 23 source manuscripts again for:
- `Chapter N`;
- `chapter N`;
- singular `previous chapter`;
- singular `last chapter`;
- singular `next chapter`;
- other unmistakable references to one specific book chapter.

If another specific reference is found:
1. verify its semantic destination;
2. map it to current 01–23 numbering;
3. link the two-digit number to the canonical route;
4. preserve surrounding author voice;
5. report it in the implementation PR.

Do not mechanically replace generic uses of “chapter” that describe:
- the current chapter;
- a metaphorical chapter of life;
- an academic/book chapter in a source/reference;
- non-specific plural chapter groups.

## Link rendering

Use the existing rich-text/markdown link path.

Internal book links must render as ordinary PEx editorial links and navigate to real canonical routes.

Do not add a custom cross-reference component unless existing parsing cannot support the required behavior.

## Tests / verification

At minimum prove:

### Homepage correction
- mandala code/component unchanged;
- affirmation exact text unchanged;
- affirmation visually smaller than standard body/book paragraph text;
- increased mandala→affirmation spacing;
- increased affirmation→book-entry spacing;
- **Read Psychical Excursion →** renders before synopsis in DOM and visually;
- link still targets `/psychical-excursion/`;
- synopsis exact accepted copy remains;
- root canonical/GA4/reduced-motion behavior unchanged.

### Menu icon correction
- chapter-menu panel/list DOM and 01–23 content unchanged;
- trigger touch target unchanged or larger;
- geometric SVG mark materially larger than prior version;
- geometry visually crosses/intersects its square relationship and is not clipped;
- Open/Close labels, `aria-expanded`, focus, Escape and mobile sheet behavior unchanged;
- root still has no menu.

### Cross-reference audit
- no stale explicit old-style `Chapter <number>` / `chapter <number>` references remain in the 23 public manuscripts except if they occur inside a quoted/reference title that is not a book cross-reference;
- all audited specific cross-references use correct current two-digit number;
- every numbered cross-reference is a link to the correct canonical route;
- no self-reference creates a pointless link to the current route;
- Chapter 4 relaxation deep link uses canonical route + fragment, not the old hash-only route;
- SEO titles, H1s, URLs, sitemap entries and menu numbering remain otherwise unchanged;
- sitemap remains 24 canonical URLs;
- previous/next reading chain unchanged;
- D-081/privacy unaffected.

Run full CI/release/canonical/brand/privacy verification and report bundle impact.

## Stop conditions

Stop and return rather than widening scope if:
- a chapter reference is ambiguous and its target cannot be proven from context;
- correcting cross-references would require rewriting a substantive claim;
- a new parser/router mechanism would materially widen architecture;
- the visual corrections materially worsen accessibility or responsive layout.

## Return

Open a separate implementation PR and report:
- PR / branch / head / baseline;
- homepage hierarchy/spacing changes;
- menu-icon geometry change;
- complete list of corrected cross-references and their targets;
- any ambiguous references intentionally left generic;
- canonical deep-link correction;
- SEO/sitemap/navigation regression;
- analytics/privacy regression;
- bundle-size effect;
- full CI result;
- unresolved issues.

Do not merge. Do not deploy manually. Do not modify `pim-control`.
