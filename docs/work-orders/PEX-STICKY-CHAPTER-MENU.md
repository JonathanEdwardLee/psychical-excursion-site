# PEx Work Order — Sticky Geometric Chapter Menu

## Baseline

Implement from accepted main:

`b3ae29c6542e9f4a8a48f17fd73965bda113fc18`

Founder-approved direction:
- book pages need an elegant geometric menu fixed at the bottom-right while reading;
- the menu should follow `knowledge/design` and the established Psychical Excursion visual language;
- it must provide direct access to all chapters;
- public chapter numbers are now allowed in this reader navigation;
- **What Is a Psychical Excursion?** is Chapter 01, giving the book exactly 23 chapters.

## Canonical chapter numbering

Use this exact menu sequence:

01 — What Is a Psychical Excursion?  
02 — Remember Your Dreams: Dream Recall Techniques and Research  
03 — Notice Your Dreams: Dream Awareness, Patterns and Dream Signs  
04 — Recognize the Dream: Lucid Dreaming, Reality Checks and Dream Signs  
05 — Feel the Body: Body Scan Meditation and Deep Relaxation  
06 — Move Your Attention: Focused Attention and Body Awareness Meditation  
07 — Build the Current: Tingling, Energy Sensations and Focused Attention  
08 — Quiet the Mind: Meditation Techniques for Sleep and Dream Awareness  
09 — See the Image: Visualization, Mental Imagery and Hypnagogic Imagery  
10 — Watch the Edge: Hypnagogia and the Transition Into Lucid Dreaming  
11 — Let the Body Sleep: The “Mind Awake, Body Asleep” Route to Lucid Dreaming  
12 — Move Without Moving: Motor Imagery, Dream Movement and Sleep-Onset Practice  
13 — Feel the Shift: Vibrations, Floating and Out-of-Body Sensations Near Sleep  
14 — Know the Threshold: How to Recognize When Waking Imagery Becomes a Dream  
15 — Stabilize the Dream: Lucid Dream Stabilization Techniques and Research  
16 — Explore the Dream: Lucid Dream Experiments, Dream Control and Research  
17 — Loosen the Body: Body Ownership, Self-Location and Out-of-Body Experience  
18 — Cross the Threshold: Astral Projection, OBE Techniques and Lucid Dreaming  
19 — Test the Experience: Can Lucid Dreams and Out-of-Body Experiences Be Verified?  
20 — Compare the Maps: Lucid Dreaming vs. Astral Projection, OBE and Sleep Paralysis  
21 — Floating in Space: Sun, Moon, Planets and the Science of Sleep & Dreams  
22 — Notice the Coincidence: Synchronicity, Recurring Dreams, Shared Dreams and Pattern Recognition  
23 — Return. Record. Repeat: The Best Bedtime Routine for Lucid Dreaming and Astral Projection

This numbering is for the reader navigation system only in this pass.

Do not prepend chapter numbers to:
- H1 titles;
- browser/document titles;
- catalog SEO titles;
- URLs;
- sitemap entries;
- manuscript prose;
- previous/next reading labels.

## Surfaces

Render this menu on all 23 book pages, beginning at `/psychical-excursion/` and continuing through the final chapter.

Do **not** render it on the root mandala homepage `/`.

## User task

A reader should be able to:
- understand their current position in the 23-chapter book;
- jump directly to any chapter;
- keep reading without losing significant viewport space;
- use the control comfortably with touch, keyboard, zoom and reduced motion.

## Visual thesis

This is a compact reading instrument, not a generic floating app menu.

Use:
- thin-line geometry;
- existing PEx monochrome tokens;
- simple square / diamond / radial relationships;
- typography-led list treatment;
- one restrained state transition.

Avoid:
- hamburger icon;
- generic round FAB;
- glassmorphism;
- heavy shadow;
- gradients;
- neon/glow;
- galaxies/crystals;
- 23 individual cards;
- decorative motion.

## Trigger

Fixed bottom-right with safe-area awareness.

Requirements:
- minimum `--tap` target;
- visible focus;
- accessible in both themes;
- safe at 200% zoom;
- does not cover the reading column on normal desktop;
- remains usable on narrow mobile screens;
- no horizontal overflow.

Create a small original geometric SVG/CSS icon using existing theme primitives. It should feel related to the mandala without duplicating it.

Closed accessible label:
**Open chapter menu**

Open accessible label:
**Close chapter menu**

Use `aria-expanded` and `aria-controls`.

## Desktop open state

Open an anchored panel above/left of the trigger.

Panel:
- continuous surface;
- one subtle border/rule system;
- bounded width;
- `max-height` constrained to viewport;
- internal scrolling;
- long real chapter titles wrap;
- current chapter is visually distinct and exposed with `aria-current="page"`;
- current chapter scrolls into view when menu opens.

Suggested hierarchy per row:

`01  What Is a Psychical Excursion?`

Number is quiet but clearly scannable. Title remains primary.

## Mobile open state

Recompose into a bottom-docked sheet, not a shrunken desktop popover.

Requirements:
- width fits viewport;
- roughly 70–80dvh max-height;
- internally scrollable chapter list;
- safe-area bottom padding;
- touch-friendly rows;
- current chapter scrolled into view;
- close control remains obvious;
- no content trap or horizontal overflow.

## Interaction behavior

- trigger toggles open/closed;
- Escape closes;
- clicking/tapping outside closes where appropriate;
- selecting a chapter navigates directly to its canonical route;
- browser Back/Forward remains correct;
- no custom client-side history hacks beyond existing route architecture;
- focus returns to trigger when Escape closes the panel;
- opening should not move document scroll;
- body content must remain readable and should not unexpectedly jump;
- no persistent saved open/closed state needed.

## Chapter data source

Derive the list from the accepted central guidebook catalog / route data. Do not hard-code a second independent title/URL list if avoidable.

The numbering may be computed from the ordered 23 book entries:
- `/psychical-excursion/` = 01;
- next entry = 02;
- ...
- final entry = 23.

Exclude the root `/` landing page from numbering and from the menu list.

## Accessibility

- semantic navigation landmark, e.g. `nav aria-label="Book chapters"`;
- real links for chapter destinations;
- `aria-current="page"` for current route;
- trigger button with `aria-expanded` and `aria-controls`;
- Escape behavior;
- visible focus;
- keyboard can reach every chapter;
- 200% zoom remains usable;
- reduced motion removes nonessential transition animation;
- touch targets meet existing design standard.

Do not build a modal focus trap unless the narrow/mobile implementation genuinely behaves as a modal dialog. Prefer a simple nonmodal navigation surface when possible.

## Analytics / privacy

Preserve D-081.

Do not create a new analytics event unless already covered by accepted aggregate navigation measurement.

No private content, account identifiers, precise location, or new tracking.

## Performance

- no new library;
- no image asset;
- use existing DOM/CSS/SVG primitives;
- derive list from existing catalog;
- keep incremental JS/CSS minimal;
- report bundle effect;
- existing >500 kB warning remains tracked debt.

## Regression boundaries

Preserve:
- canonical root homepage and mandala;
- all 24 canonical URLs;
- all 23 book routes;
- Chapter 01 at `/psychical-excursion/`;
- Chapter 23 final route;
- existing previous/next reading chain;
- Floating in Space title;
- Chapter 5 mandala/instrument;
- Chapter 4 deep link;
- Sky Clock;
- light/dark themes;
- reduced-motion behavior;
- D-081 GA4;
- sitemap/robots/PWA/honest 404 behavior;
- held feature boundaries.

## Verification

At minimum prove:
- menu absent on `/`;
- menu present on Chapter 01 and Chapters 02–23;
- exactly 23 chapter links;
- exact numbering 01–23;
- Chapter 01 is **What Is a Psychical Excursion?**;
- Chapter 23 is **Return. Record. Repeat...**;
- current route gets `aria-current="page"`;
- current row is brought into menu view on open;
- trigger accessible labels and expanded state correct;
- Escape closes and returns focus;
- direct chapter selection uses canonical routes;
- desktop panel bounded and internally scrollable;
- mobile recomposition fits viewport with no horizontal overflow;
- reduced motion disables nonessential transition;
- root homepage remains visually/menu clean;
- SEO titles/URLs/H1s remain unnumbered;
- sitemap remains 24 canonical HTTPS URLs;
- existing reading chain unchanged;
- GA4 canonical page paths unchanged;
- full release/canonical/brand/privacy suite green.

Run full CI/release verification.

## Return

Open a separate implementation PR and report:
- branch/head/baseline;
- chapter-menu component/data source;
- exact numbering proof;
- desktop/mobile behavior;
- accessibility behavior;
- route/navigation regression;
- sitemap/SEO regression;
- analytics/privacy regression;
- bundle-size effect;
- full CI result;
- unresolved issues.

Do not merge. Do not deploy manually. Do not modify `pim-control`.
