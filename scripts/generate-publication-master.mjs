#!/usr/bin/env node
/**
 * Snapshot Publication Master chapters from the accepted Web Edition.
 * Does not modify src/content/guidebook*.source.md.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const PUBLICATION_BASELINE = "c969ebb5650e4f854b3d1a1284458a818eb71cfb";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = join(ROOT, "src/content");
const OUT = join(ROOT, "publication");

const ATTENTION_OPENING = `If you have the printed figure of concentric geometry around a still center, rest your gaze on that center. If you are listening, pick a still point you can return to: a small mark on a wall, a distant lamp, or an imagined point in the dark. You do not need to see moving rings. The rings, if present, turn so slowly that you may need a few seconds to decide whether anything is moving at all.
`;

/** Web file → menu 01–23. Intro is the manuscript; catalog home is menu 01. */
export const PUBLICATION_CHAPTERS = [
  { menu: "01", source: "guidebookManuscript.source.md", slug: "01-what-is-a-psychical-excursion" },
  { menu: "02", source: "guidebookChapter01.source.md", slug: "02-remember-your-dreams" },
  { menu: "03", source: "guidebookChapter02.source.md", slug: "03-notice-your-dreams" },
  { menu: "04", source: "guidebookChapter03.source.md", slug: "04-recognize-the-dream" },
  { menu: "05", source: "guidebookChapter04.source.md", slug: "05-feel-the-body" },
  { menu: "06", source: "guidebookChapter05.source.md", slug: "06-move-your-attention" },
  { menu: "07", source: "guidebookChapter06.source.md", slug: "07-build-the-current" },
  { menu: "08", source: "guidebookChapter07.source.md", slug: "08-quiet-the-mind" },
  { menu: "09", source: "guidebookChapter08.source.md", slug: "09-see-the-image" },
  { menu: "10", source: "guidebookChapter09.source.md", slug: "10-watch-the-edge" },
  { menu: "11", source: "guidebookChapter10.source.md", slug: "11-let-the-body-sleep" },
  { menu: "12", source: "guidebookChapter11.source.md", slug: "12-move-without-moving" },
  { menu: "13", source: "guidebookChapter12.source.md", slug: "13-feel-the-shift" },
  { menu: "14", source: "guidebookChapter13.source.md", slug: "14-know-the-threshold" },
  { menu: "15", source: "guidebookChapter14.source.md", slug: "15-stabilize-the-dream" },
  { menu: "16", source: "guidebookChapter15.source.md", slug: "16-explore-the-dream" },
  { menu: "17", source: "guidebookChapter16.source.md", slug: "17-loosen-the-body" },
  { menu: "18", source: "guidebookChapter17.source.md", slug: "18-cross-the-threshold" },
  { menu: "19", source: "guidebookChapter18.source.md", slug: "19-test-the-experience" },
  { menu: "20", source: "guidebookChapter19.source.md", slug: "20-compare-the-maps" },
  { menu: "21", source: "guidebookChapter20.source.md", slug: "21-floating-in-space" },
  { menu: "22", source: "guidebookChapter21.source.md", slug: "22-notice-the-coincidence" },
  { menu: "23", source: "guidebookChapter22.source.md", slug: "23-return-record-repeat" },
];

function stripMarkdownLinks(text) {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

/** Session-script / word-count view only. Canonical Publication Master keeps [n] markers. */
export function narrationView(adapted) {
  const cut = adapted.search(/\n## References\n/);
  const spoken = cut >= 0 ? adapted.slice(0, cut) : adapted;
  return spoken.replace(/\[(\d+)\]/g, "");
}

function spokenRelaxation(text) {
  return text
    .replace(
      /^Begin with \*\*Relax the body\*\*/gm,
      "Begin with the relaxation practice we called **Relax the body**",
    )
    .replace(
      /begin with \*\*Relax the body\*\*/g,
      "begin with the relaxation practice we called **Relax the body**",
    )
    .replace(
      /when you are ready for sleep, \*\*Relax the body\*\*/gi,
      "when you are ready for sleep, use the relaxation practice we called **Relax the body**",
    )
    .replace(
      /At bedtime, \*\*Relax the body\*\*/g,
      "At bedtime, use the relaxation practice we called **Relax the body**",
    )
    .replace(
      /\. \*\*Relax the body\*\*\./g,
      ". Use the relaxation practice we called **Relax the body**.",
    );
}

function spokenSkyClock(text) {
  return text
    .replace(/Our Sky Clock/g, "The Sky Clock")
    .replace(
      /The Sky Clock already treats the sky observationally\./,
      "Treat the sky observationally. If you have the companion website's Sky Clock, an almanac, or another honest astronomy source, use it as a record of where the Sun and Moon actually are—not as a personality forecast.",
    );
}

export function adaptWebChapter(raw) {
  let text = raw.replace(/\r\n/g, "\n").trim();
  const refSplit = text.search(/\n## References\n/);
  let body = refSplit >= 0 ? text.slice(0, refSplit) : text;
  const refs = refSplit >= 0 ? text.slice(refSplit) : "";

  body = body.replace(/^pex:attention-instrument\n+/m, `${ATTENTION_OPENING}\n`);
  body = stripMarkdownLinks(body);
  body = spokenRelaxation(body);
  body = spokenSkyClock(body);
  body = body.replace(/\n{3,}/g, "\n\n");

  const printRefs = refs ? `\n${refs.trim()}\n` : "";
  return `${body.trim()}\n${printRefs}`;
}

function titleOf(raw) {
  const line = raw.replace(/\r\n/g, "\n").trim().split("\n")[0] ?? "";
  return line.replace(/^#\s+/, "").trim();
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function narrationWordCount(adapted) {
  return countWords(narrationView(adapted));
}

export function buildPublicationMaster() {
  const chaptersDir = join(OUT, "chapters");
  mkdirSync(chaptersDir, { recursive: true });
  mkdirSync(join(OUT, "front-matter"), { recursive: true });
  mkdirSync(join(OUT, "back-matter"), { recursive: true });
  mkdirSync(join(OUT, "audio"), { recursive: true });
  mkdirSync(join(OUT, "references"), { recursive: true });

  const manifestChapters = [];
  const bookParts = [];
  const adaptationNotes = [];
  let totalWords = 0;
  let narrationWords = 0;

  for (const entry of PUBLICATION_CHAPTERS) {
    const sourceRel = `src/content/${entry.source}`;
    const raw = readFileSync(join(CONTENT, entry.source), "utf8");
    const title = titleOf(raw);
    const adapted = adaptWebChapter(raw);
    const front = [
      "---",
      `menu: "${entry.menu}"`,
      `title: ${JSON.stringify(title)}`,
      `source_web_file: ${sourceRel}`,
      `web_edition_baseline: ${PUBLICATION_BASELINE}`,
      "edition: publication-master",
      "---",
      "",
    ].join("\n");
    const outPath = join(chaptersDir, `${entry.slug}.md`);
    writeFileSync(outPath, `${front}${adapted}`);
    const words = countWords(adapted);
    const spoken = narrationWordCount(adapted);
    totalWords += words;
    narrationWords += spoken;
    manifestChapters.push({
      menu: entry.menu,
      title,
      path: `chapters/${entry.slug}.md`,
      source_web_file: sourceRel,
      words,
      narration_words_excluding_references: spoken,
    });
    bookParts.push(`<!-- ${entry.menu} ${title} -->\n\n${adapted}`);
    const deltas = [];
    if (raw.includes("pex:attention-instrument")) {
      deltas.push("Geometric attention object: print figure optional; spoken still-point alternative.");
    }
    if (raw.includes("](/")) deltas.push("Hyperlinks converted to spoken names; URLs not narrated.");
    if (raw.includes("Sky Clock")) {
      deltas.push("Sky Clock treated as an observational astronomy record, usable without the website UI.");
    }
    if (!deltas.length) {
      deltas.push("No publication-specific prose adaptation beyond format handling.");
    }
    deltas.push("Inline [n] citation markers retained in the Publication Master for print/ebook provenance; narration omits them at session-script time.");
    adaptationNotes.push({ menu: entry.menu, title, deltas });
  }

  writeFileSync(
    join(OUT, "manifest.json"),
    `${JSON.stringify({
      edition: "publication-master",
      web_edition_baseline: PUBLICATION_BASELINE,
      chapter_count: manifestChapters.length,
      total_words: totalWords,
      narration_words_excluding_references: narrationWords,
      chapters: manifestChapters,
    }, null, 2)}\n`,
  );

  writeFileSync(
    join(OUT, "BOOK-MASTER.md"),
    [
      "---",
      "edition: publication-master",
      `web_edition_baseline: ${PUBLICATION_BASELINE}`,
      "note: Assembled from publication/chapters. Web Edition remains src/content/guidebook*.source.md.",
      "---",
      "",
      "# Psychical Excursion",
      "",
      "Jonathan Lee",
      "",
      bookParts.join("\n\n---\n\n"),
      "",
    ].join("\n"),
  );

  writeFileSync(
    join(OUT, "ADAPTATION-LOG.md"),
    [
      "# Publication Master adaptation log",
      "",
      `Web Edition baseline: \`${PUBLICATION_BASELINE}\`.`,
      "",
      "Transforms applied to all chapters: markdown links → visible labels (no URLs in narrative). Inline `[n]` citation markers stay in the Publication Master for print/ebook. Narration omits those markers and `## References` lists at session-script time, not by deleting them from the master.",
      "",
      ...adaptationNotes.flatMap((note) => [
        `## ${note.menu} — ${note.title}`,
        ...note.deltas.map((d) => `- ${d}`),
        "",
      ]),
    ].join("\n"),
  );

  return { totalWords, narrationWords, chapters: manifestChapters.length };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const result = buildPublicationMaster();
  process.stdout.write(
    `Publication Master: ${result.chapters} chapters, ${result.totalWords} words, ${result.narrationWords} narration words.\n`,
  );
}
