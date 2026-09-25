# Psychical Excursion — Publication Master

This directory is the **Publication Master** for print, ebook, audiobook, and later spoken read-throughs.

It is **not** the live website.

| Edition | Canonical source | Mutates the other? |
| --- | --- | --- |
| Web Edition | `src/content/guidebook*.source.md` | No |
| Publication Master | `publication/` | No |

Web Edition baseline for this snapshot:

`c969ebb5650e4f854b3d1a1284458a818eb71cfb`

A later website edit does not silently become the book. A later book edit does not silently become the website. Rebuild only with `node scripts/generate-publication-master.mjs` when a founder-approved re-snapshot is intended, then review `ADAPTATION-LOG.md`.

## Layout

- `chapters/` — 23 snapshot chapters (menu 01–23)
- `BOOK-MASTER.md` — assembled manuscript
- `manifest.json` — provenance, word counts
- `front-matter/` — title, evidence, sleep/safety
- `back-matter/` — acknowledgments placeholder, about the author, continue the experiment
- `audio/` — narration rules, pronunciation, acronyms
- `references/` — how print vs audio treat sources
- `ADAPTATION-LOG.md` — bounded deltas from the Web Edition

## Spoken vs print

Narrative in `chapters/` is written to work on the page and aloud. Inline citation numbers and URLs are omitted from narrative. Full references remain at the end of each chapter for print/ebook. Do not read those lists in the audiobook.
