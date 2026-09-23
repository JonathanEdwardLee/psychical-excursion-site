# PEx Chapter 5 Work Order — Move Your Attention.

## Authority / baseline

Founder-approved direction from Jonathan and PEX_PRIMARY.

Implementation repo: `JonathanEdwardLee/psychical-excursion-site`

Start from accepted main:

`652aa842c520d7ed0a8126602e32466719a8c1dc`

Current public sequence:

Introduction → **You Are Dreaming. Remember.** → **You Are Dreaming. Notice.** → **You Are Dreaming. Recognize.** → **Feel the Body.**

Chapter 5 working title:

**Move Your Attention.**

CloudDev is the implementation worker. PEX_PRIMARY owns research conclusions, manuscript voice, and source acceptance.

Do not invent the Chapter 5 manuscript. This work order authorizes implementation plumbing, navigation improvements, the visual attention object, anchors/cross-link support, tests, and a manuscript placeholder only until approved prose is supplied.

## Outcome

Prepare the site so Chapter 5 can be dropped in cleanly and so the new attention experiment is available as a first-class guidebook visual.

Acceptance criteria:

1. Chapter 5 route/content plumbing exists but does not expose unapproved prose.
2. A reusable, original PEx visual-attention object exists and can be embedded in Chapter 5.
3. Chapter 4 progressive muscle relaxation has a stable deep-link anchor.
4. Explicit guidebook text **Relax the body** can link to that anchor from Chapter 5 and later chapters.
5. Every chapter page now includes a previous-chapter back arrow while preserving the existing forward next-reading link.
6. Header, Sky Clock, reading width, section reveals, theme behavior, footer centering, and Summary / Experiment / Intention component remain unchanged.
7. Held features stay held.

## Chapter 5 route

Preferred route:

`#/move-your-attention`

Preferred source:

`src/content/guidebookChapter05.source.md`

Use the existing manuscript/route architecture.

Until PEX_PRIMARY supplies the approved Chapter 5 manuscript, use only a clearly marked implementation placeholder that cannot be mistaken for book prose and must not be publicly exposed as finished content.

Do not add the Chapter 4 → Chapter 5 public next-reading link until the manuscript is approved unless the route safely gates unavailable content.

## Visual attention object — high-detail requirement

This is not a generic spinner, breathing circle, loading indicator, or decorative SVG.

Create an original **precision contemplative instrument** inspired by the geometric density and symmetry of detailed mandalas, without copying Tibetan, Buddhist, Hindu, yantra, or other sacred iconography.

The object should feel like:

- rings of geometry inside rings of geometry;
- mathematical symmetry;
- extremely clean alignment;
- thin-line construction;
- centered around one absolutely stable focal point;
- intricate enough to reward sustained looking;
- consistent with the existing PEx Soft Instrument visual language;
- subtly strange, precise, and calm rather than psychedelic.

Suggested geometric layers:

1. tiny fixed center point;
2. small central rosette or polygonal construction;
3. first concentric boundary ring;
4. radial spokes;
5. repeating geometric cells around a ring;
6. nested triangle / diamond / polygon relationships where original and non-sacred;
7. secondary concentric rings with fine tick divisions;
8. thin orbital arcs;
9. four or eight subtle directional markers;
10. a larger outer instrument circle;
11. extremely faint geometry beyond the primary boundary.

Prefer mathematically generated symmetry over manually eyeballed placement.

The result should visibly approach the complexity and geometric perfection of a detailed contemplative diagram while remaining unmistakably original to Psychical Excursion.

### Motion

Motion must be extremely slow.

Examples:

- one inner layer rotating once every roughly 2–4 minutes;
- another layer rotating in the opposite direction on a different long period;
- one ring very subtly expanding/contracting only a few percent over a long period;
- optional very slow phase offset between geometric rings;
- center point remains stationary.

At first glance, movement may be almost imperceptible.

Do not use:

- flashing;
- strobing;
- rapid pulsation;
- fast rotation;
- rhythmic opacity flicker;
- "theta", "alpha", "gamma", Hz, binaural, entrainment, or brainwave claims;
- photosensitive-risk effects.

### Reduced motion

Under `prefers-reduced-motion: reduce`:

- render the complete geometry statically;
- preserve all visual detail;
- no essential information may depend on motion.

### Accessibility

The visual is an experiment/supporting object, not the sole carrier of an instruction.

Provide an appropriate semantic label or nearby descriptive text when embedded.

It must scale cleanly on narrow/mobile and desktop widths without clipping or becoming illegible.

Use vector geometry where practical.

## Intended Chapter 5 visual experiment

The final approved manuscript will likely instruct the reader to:

1. look gently toward the fixed center of the visual;
2. allow attention to return to the center when it wanders;
3. close the eyes;
4. observe whatever occurs — afterimage, geometry, color, speckles, or blackness;
5. transfer that same quality of attention into the center of one palm;
6. move the felt/known point palm → wrist → forearm → elbow;
7. reverse direction;
8. compare sensation.

Implementation should support that use cleanly.

Do not add explanatory prose beyond neutral UI/accessibility copy.

## Aphantasia / imagery requirement

The visual and future content must not assume a reader can form vivid voluntary mental pictures.

Design for readers who may:

- see vivid internal images;
- see faint imagery;
- see mostly blackness;
- use spatial knowledge rather than pictures;
- rely on tactile or kinesthetic sensation;
- simply know where attention is directed.

Do not implement UI text implying that lack of an afterimage or visualization is failure.

## Chapter 4 relaxation deep link

Add a stable anchor to the beginning of the actual nighttime progressive-muscle-relaxation practice in Chapter 4.

Preferred target section:

**A Nighttime Body Release**

Preferred hash fragment or equivalent stable anchor:

`#/feel-the-body#nighttime-body-release`

If the current hash-router architecture needs a different technically correct representation, preserve the user-visible behavior: selecting **Relax the body** from another chapter lands directly at the beginning of that Chapter 4 practice and keeps normal page rendering/scroll behavior intact.

Do not link merely to the top of Chapter 4.

Add tests for direct navigation and scrolling/target behavior.

## "Relax the body" linking rule

From Chapter 5 onward, when PEX_PRIMARY manuscript text uses the explicit practice phrase **Relax the body** as an instruction/reference to the established technique, render it as a link to Chapter 4's nighttime relaxation anchor.

Do not auto-link arbitrary uses of the individual words "relax" or "body."

Prefer a manuscript-safe explicit link convention over brittle global string replacement.

This should be reusable for later chapters.

## Previous-chapter navigation

Add a restrained previous-chapter control to guidebook chapter pages.

Requirements:

- chapter 1 previous destination: guidebook Introduction/home;
- chapter 2 previous destination: Chapter 1;
- chapter 3 previous destination: Chapter 2;
- chapter 4 previous destination: Chapter 3;
- chapter 5 previous destination: Chapter 4 once Chapter 5 is public.

Visual direction:

- a simple back arrow;
- quiet editorial navigation;
- not a large CTA/button;
- consistent with the book aesthetic;
- obvious enough to use on mobile;
- accessible name includes the destination chapter/title;
- should not compete with the chapter title.

Preserve the existing forward next-reading link at chapter end.

Do not create a chapter index/menu.

## Dream thread for Chapters 5–7

No implementation-specific prose is authorized yet, but preserve room in the manuscript flow for a small recurring dream reminder.

Current editorial direction:

- Chapters 5–7 remain body/energy/attention dominant;
- each includes a brief dream fact, reminder, or sincere **Am I dreaming?** cue;
- this is not a new UI component unless PEX_PRIMARY later approves one;
- do not invent the text.

## Permanent practice component

Preserve the established end-of-chapter component:

**Summary**
**Experiment**
**Intention**

Chapter 5 will use it once the manuscript is supplied.

Do not alter its current style unless required to fix a defect.

## Visual integration

The Chapter 5 attention object may be implemented as a reusable guidebook component.

It should:

- fit inside the current reading surface;
- have enough width/height to show its detail clearly;
- avoid introducing a heavy card or dashboard surface;
- participate naturally in the guidebook reveal behavior;
- work in light and dark themes;
- use current design tokens where practical;
- remain elegant when static.

Do not redesign the overall ambient background to compensate for the visual.

The object itself is the focal experiment.

## Locked site decisions

Do not change:

- compact header;
- logo treatment;
- Sky Clock appearance/function;
- footer wording;
- reading width;
- core typography;
- existing section reveal behavior;
- current light/dark interaction;
- existing Chapter 1–4 main prose;
- Summary / Experiment / Intention visual grammar.

## Held features

Do not expose or reopen:

- Google sign-in;
- Dream Journal product UI;
- voice recording;
- Drive;
- Calendar;
- progress/checkmarks/streaks;
- Days index;
- separate Astronomy page;
- fixed 60-day framing.

No new recurring services.

No new dependency unless truly necessary; prefer current stack/SVG/CSS.

## Tests / verification

Add or update tests covering at minimum:

- Chapter 5 route plumbing/gating;
- existing Chapters 1–4 remain available;
- previous navigation destination for each public chapter;
- Chapter 4 relaxation anchor exists;
- direct deep link to the relaxation section resolves correctly;
- explicit **Relax the body** link convention resolves to that anchor;
- attention object renders;
- attention object contains no rapid/flicker timing;
- reduced-motion leaves full geometry visible/static;
- light/dark mode readability;
- narrow/mobile layout;
- next-reading behavior remains intact;
- Summary / Experiment / Intention remains intact;
- held features absent from public guidebook;
- header DOM/structure is unchanged unless strictly required for unrelated defect correction.

Run:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- existing release/canonical/privacy verification used by CI where applicable.

## Stop conditions

Stop and report rather than widening scope if:

- Chapter 5 requires authoring new guidebook prose;
- the visual would require rapid flicker or a brainwave claim;
- deep-link behavior cannot be implemented without breaking hash routing;
- previous navigation requires redesigning the header;
- existing guidebook parser architecture cannot support explicit cross-links cleanly without a material rewrite;
- a new third-party dependency/service appears necessary;
- held features would become public.

## Return to PEX_PRIMARY

Open a PR from a new implementation branch and return:

1. PR number;
2. exact head SHA;
3. files changed;
4. screenshots/browser evidence for the visual on desktop and narrow/mobile if available;
5. description of how the geometry is generated;
6. exact animation periods;
7. reduced-motion behavior;
8. Chapter 4 relaxation anchor implementation;
9. previous-chapter navigation behavior;
10. Chapter 5 route/manuscript integration point;
11. tests/typecheck/lint/build results;
12. any issue that needs PEX_PRIMARY/manuscript input.

Do not merge.

PEX_PRIMARY source-reviews. Jonathan is final authority.
