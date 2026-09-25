# PEx SEO Titles, Crawlable Routes, and Sitemap Work Order

## Baseline

Implement from accepted main:

`8938433e52ae1a79ec9e6aa65bea36e1c3c9bf20`

That baseline includes the accepted **Explore the Dream** implementation.

Jonathan explicitly approved on 2026-09-24:
- replacing the current short/vague book titles with the previously proposed SEO-facing titles;
- using the approved descriptive slugs as the public URLs;
- not exposing chapter numbers publicly because final order may change after research;
- then creating the sitemap for Search Console.

This is a discoverability/IA migration, not a manuscript-research rewrite.

## Business / product objective

Make the public guidebook understandable and discoverable to people searching for lucid dreaming, dream recall, visualization, meditation, hypnagogia, sleep-edge practice, out-of-body experiences, astral projection and related research.

The visible book title, H1, document title and canonical route should all clearly describe what the page discusses while preserving the Psychical Excursion voice.

## Canonical published title + URL map

Use these as the actual public book titles, not subtitles.

| Existing section | New canonical book title | Canonical path |
| --- | --- | --- |
| Introduction — What Is a Psychical Excursion? | **Psychical Excursion: Lucid Dreaming, Meditation, Visualization & OBE Research** | `/psychical-excursion/` |
| You Are Dreaming. Remember. | **Remember Your Dreams: Dream Recall Techniques and Research** | `/dream-recall/` |
| You Are Dreaming. Notice. | **Notice Your Dreams: Dream Awareness, Patterns and Dream Signs** | `/dream-awareness-signs/` |
| You Are Dreaming. Recognize. | **Recognize the Dream: Lucid Dreaming, Reality Checks and Dream Signs** | `/lucid-dreaming-reality-checks/` |
| Feel the Body. | **Feel the Body: Body Scan Meditation and Deep Relaxation** | `/body-scan-meditation/` |
| Move Your Attention. | **Move Your Attention: Focused Attention and Body Awareness Meditation** | `/attention-body-awareness/` |
| Build the Current. | **Build the Current: Tingling, Energy Sensations and Focused Attention** | `/energy-sensations-meditation/` |
| Quiet the Mind. | **Quiet the Mind: Meditation Techniques for Sleep and Dream Awareness** | `/meditation-for-lucid-dreaming/` |
| See the Image. | **See the Image: Visualization, Mental Imagery and Hypnagogic Imagery** | `/visualization-hypnagogic-imagery/` |
| Watch the Edge. | **Watch the Edge: Hypnagogia and the Transition Into Lucid Dreaming** | `/hypnagogia-lucid-dreaming/` |
| Let the Body Sleep. | **Let the Body Sleep: The “Mind Awake, Body Asleep” Route to Lucid Dreaming** | `/mind-awake-body-asleep/` |
| Move Without Moving. | **Move Without Moving: Motor Imagery, Dream Movement and Sleep-Onset Practice** | `/motor-imagery-lucid-dreaming/` |
| Feel the Shift. | **Feel the Shift: Vibrations, Floating and Out-of-Body Sensations Near Sleep** | `/out-of-body-sensations-sleep/` |
| Know the Threshold. | **Know the Threshold: How to Recognize When Waking Imagery Becomes a Dream** | `/entering-a-lucid-dream/` |
| Stabilize the Dream. | **Stabilize the Dream: Lucid Dream Stabilization Techniques and Research** | `/lucid-dream-stabilization/` |
| Explore the Dream. | **Explore the Dream: Lucid Dream Experiments, Dream Control and Research** | `/lucid-dream-experiments/` |

Do not expose chapter numbers in titles, URLs, breadcrumbs, metadata or visible navigation.

Future unpublished sections may be renamed under the same principle, but **do not invent a final title/slug for Watch the Sky in this pass**; that research lane is not yet complete.

## Real crawlable URL architecture

The current public site uses hash routes. Replace published guidebook canonical routing with the real paths above.

Requirements:

- A cold direct request to every canonical path must return HTTP 200 from the static Hostinger artifact.
- Do not rely on an Apache SPA catch-all that turns every unknown URL into 200.
- Generate/ship a real static `index.html` entry point at each canonical directory path (for example `dist/lucid-dream-stabilization/index.html` or equivalent release output).
- Each route HTML must contain before JavaScript execution:
  - page-specific `<title>`;
  - a truthful page-specific meta description;
  - `<link rel="canonical" href="https://psychicalexcursion.com/<path>/">`;
  - normal responsive/meta/PWA/GA4 shell requirements.
- The application must resolve the current page from `window.location.pathname`, not require a hash route.
- In-page anchors may continue to use fragments after the real path.
- Preserve app-shell accessibility, Light/Dark, Sky Clock, section reveals, reduced motion, previous/next reading flow and GA4.
- Preserve the service worker/PWA behavior and update it for real-path navigation/offline behavior as needed.

### Introduction/root behavior

The approved canonical introduction is:

`https://psychicalexcursion.com/psychical-excursion/`

To avoid duplicate introduction content:
- bare `https://psychicalexcursion.com/` should 301 to `/psychical-excursion/`;
- `www` should still 301 to apex;
- HTTP should still 301 to HTTPS.

Update PWA start URL / shell assumptions if needed so installation still opens a valid canonical surface.

## Legacy hash-route compatibility

Existing links must not simply break.

Support legacy public hashes by converting them client-side to the corresponding real canonical path using `history.replaceState` / navigation before analytics sends the canonical page view.

Examples:
- `/#/stabilize-the-dream` → `/lucid-dream-stabilization/`
- `/#/feel-the-shift` → `/out-of-body-sensations-sleep/`
- `/#/explore-the-dream` → `/lucid-dream-experiments/`

Preserve the existing relaxation deep link semantically:
- old `/#/feel-the-body#nighttime-body-release`
- canonical `/body-scan-meditation/#nighttime-body-release`

The old hash aliases are compatibility only, not canonical URLs and not sitemap entries.

## Manuscript/title migration

Change the actual H1/book title of each published section to the canonical SEO title in the table.

Do not otherwise rewrite chapter body prose in this pass except where a sentence literally references the old title and must be adjusted for coherence.

Preserve:
- references;
- experiment content;
- Summary / Experiment / Intention;
- source evidence boundaries;
- author voice;
- no public internal “PEx” shorthand.

Navigation labels should use the new canonical titles or a shorter truthful accessible form only where the full label would harm layout. If shortened visually, accessible/title metadata should preserve the full canonical title.

## SEO metadata

For each published page:
- canonical title is the page H1/book title above;
- browser title may append ` | Psychical Excursion`;
- write a unique concise meta description based only on the actual chapter content;
- canonical URL must be absolute apex HTTPS;
- do not add unsupported structured claims;
- do not keyword-stuff;
- do not add chapter numbers.

Add appropriate `robots` index/follow behavior if not already present.

## Sitemap

Create a static XML sitemap at:

`https://psychicalexcursion.com/sitemap.xml`

It must list only canonical, published, crawlable URLs in this pass:

1. `https://psychicalexcursion.com/psychical-excursion/`
2. `https://psychicalexcursion.com/dream-recall/`
3. `https://psychicalexcursion.com/dream-awareness-signs/`
4. `https://psychicalexcursion.com/lucid-dreaming-reality-checks/`
5. `https://psychicalexcursion.com/body-scan-meditation/`
6. `https://psychicalexcursion.com/attention-body-awareness/`
7. `https://psychicalexcursion.com/energy-sensations-meditation/`
8. `https://psychicalexcursion.com/meditation-for-lucid-dreaming/`
9. `https://psychicalexcursion.com/visualization-hypnagogic-imagery/`
10. `https://psychicalexcursion.com/hypnagogia-lucid-dreaming/`
11. `https://psychicalexcursion.com/mind-awake-body-asleep/`
12. `https://psychicalexcursion.com/motor-imagery-lucid-dreaming/`
13. `https://psychicalexcursion.com/out-of-body-sensations-sleep/`
14. `https://psychicalexcursion.com/entering-a-lucid-dream/`
15. `https://psychicalexcursion.com/lucid-dream-stabilization/`
16. `https://psychicalexcursion.com/lucid-dream-experiments/`

Do not invent `lastmod` dates that are not sourced from real build/content data. Omit optional sitemap fields if they would be fabricated.

Add `/robots.txt` if absent with a normal allow policy and:

`Sitemap: https://psychicalexcursion.com/sitemap.xml`

Sitemap and robots files must be included in the release artifact and direct-fetchable without JavaScript.

## GA4

Preserve D-081 exactly.

After route migration:
- page views must use the real canonical pathname;
- one page view per real page navigation;
- no duplicate page view caused by legacy hash migration;
- in-page anchors must not create a new page view;
- no query/free-text/private/user-authored content;
- exact Measurement ID remains `G-297PE2TV2R`;
- do not add Ads, remarketing, User-ID or other analytics expansion.

## Redirect/rewrite safety

Update `deploy/.htaccess` deliberately:
- HTTPS and www canonicalization remain;
- root redirects to `/psychical-excursion/`;
- canonical route directories are real artifact paths and must resolve normally;
- no generic “unknown path → index.html 200” fallback;
- unknown routes should remain honest 404s.

## Verification

Automated coverage must prove:
- all 16 canonical published paths are unique;
- all 16 generated route entry files exist in release;
- all 16 direct route entry files have unique correct H1/title/canonical metadata;
- sitemap is valid XML and contains exactly the 16 canonical URLs;
- sitemap has no hash URLs;
- robots.txt points to the sitemap;
- no public chapter numbers in titles/URLs/navigation;
- old hash aliases resolve to correct canonical paths;
- old Chapter 4 relaxation deep link maps to the real-path anchor;
- root redirect rule is correct;
- unknown routes are not converted to false 200s;
- GA4 page views use real canonical paths and remain deduplicated/privacy-bounded;
- PWA manifest/service worker behavior still passes;
- all prior chapter content/practice/reference assertions remain intact.

Run:
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run package:release`
- `npm run verify:release`
- `npm run verify:canonical`
- `npm run verify:brand`
- `npm run verify:privacy`
- publish tests / release report.

## Return

Open a separate implementation PR and report:
- PR / branch / head / baseline;
- complete title/path mapping implemented;
- generated static-route strategy;
- root and legacy-route behavior;
- sitemap and robots artifact paths;
- GA4 route behavior;
- changed files;
- full verification results;
- any SEO limitation that remains.

Do not merge. Do not deploy manually. Do not modify `pim-control`.
