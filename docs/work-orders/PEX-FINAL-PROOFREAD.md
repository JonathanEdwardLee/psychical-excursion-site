# PEx Work Order — Final Proofread / Publication Cleanup

## Baseline

Implement from accepted main:

`70af515765391a9df349d7a9672ed9072b17ac8f`

All three substantive book-harmonization passes are complete across Chapters 01–23.

## Mission

Perform one final **proofread-only** sweep of the complete Psychical Excursion manuscript and public book shell.

This is not a fourth rewriting pass.

The manuscript now has acceptable one-author continuity. Preserve that.

## Scope

Read all 23 chapter source manuscripts in order and check only:

- typos;
- spelling;
- punctuation;
- accidental duplicate words;
- broken or awkward sentence joins introduced by prior edits;
- heading capitalization/case consistency;
- reference punctuation and formatting consistency;
- DOI/URL presentation consistency;
- obvious citation-number mismatch;
- broken internal links;
- obvious repeated phrase/tic that survives only as accidental duplication;
- Summary → Experiment → Intention → References ordering;
- exact final affirmation/instruction preservation;
- final chapter numbering/menu consistency;
- accidental stale terminology or old fixed-60-day wording.

## Hard boundary

Do **not**:
- add new research topics;
- materially rewrite paragraphs;
- change chapter arguments;
- add or remove personal stories;
- alter voice for style preference;
- normalize all human variation;
- add chapter callbacks;
- reorder chapters;
- change canonical titles or routes;
- change experiments except to fix a typo or clear contradiction;
- change the exact final affirmation:
  **My body sleeps. I remain aware. I recognize the transition and calmly enter.**
- change the exact inside-state instruction:
  **I stay with the experience and explore before I explain.**
- change the classic MILD alternative:
  **Next time I am dreaming, I remember that I am dreaming.**

If something looks like a substantive editorial problem rather than a proofread issue, report it instead of silently rewriting it.

## Heading consistency

Audit heading case across the book.

Use the existing dominant book convention; do not blindly title-case every heading if sentence case is clearly intentional.

Correct only obvious inconsistencies where equivalent heading types differ accidentally.

## Reference consistency

Audit:
- author punctuation;
- article-title quotation style;
- journal/book italics markup;
- volume/issue/year/page formatting;
- DOI formatting;
- raw DOI vs `https://doi.org/` consistency where practical;
- PMID-only entries that should already have been repaired;
- duplicate references;
- citation numbers that do not resolve.

Do not replace valid sources merely for formatting preference.

## Internal-link consistency

Check:
- `Relax the body` canonical route + fragment;
- `Build the Current` actionable link;
- `Test the Experience` actionable link;
- no stale `#/` legacy references in public manuscript prose unless intentionally required;
- no nonessential numeric chapter callbacks reintroduced.

## Whole-book checks

Prove:
- exactly 23 book chapters remain;
- root homepage remains separate;
- sitemap remains 24 canonical URLs;
- menu numbering remains 01–23;
- H1/SEO titles remain unnumbered;
- no public `PEx` shorthand appears;
- no fixed 60-day public framing;
- no held product features leak into prose;
- no evidence claim is strengthened during proofreading;
- no new analytics/privacy behavior.

## Verification

Run full:
- tests
- lint
- typecheck
- build
- package
- verify:release
- verify:canonical
- verify:brand
- verify:privacy

## Return

Open a separate implementation PR and report:
- files changed;
- typo/punctuation fixes;
- heading consistency fixes;
- reference-format fixes;
- internal-link fixes;
- any substantive issue intentionally left untouched and flagged for founder/Primary;
- full CI result;
- confirmation that no substantive rewrite occurred.

Do not merge.
Do not deploy manually.
Do not modify `pim-control`.
