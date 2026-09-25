import source from "./guidebookChapter01.source.md?raw";
import { ATTENTION_INSTRUMENT_TOKEN } from "./guidebookAnchors.ts";

export const CHAPTER_01_TITLE = "Remember Your Dreams: Dream Recall Techniques and Research";
export const CHAPTER_01_PATH = "/dream-recall/";
export const CHAPTER_01_HASH = CHAPTER_01_PATH;

export const PRACTICE_LABELS = ["Summary", "Experiment", "Intention"] as const;
export type PracticeLabel = (typeof PRACTICE_LABELS)[number];

export type ChapterBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "emphasis"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "subheading"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "list"; items: string[]; ordered: boolean }
  | { kind: "rule" }
  | { kind: "practice"; parts: PracticePart[] }
  | { kind: "attention" };

export type PracticePart = {
  label: PracticeLabel;
  blocks: ChapterBlock[];
};

export type ChapterDocument = {
  title: string;
  blocks: ChapterBlock[];
  references: string[];
};

function isPracticeLabel(value: string): value is PracticeLabel {
  return (PRACTICE_LABELS as readonly string[]).includes(value);
}

function practiceHeading(line: string): PracticeLabel | null {
  const match = line.match(/^#{2,3}\s+(.*)$/);
  if (!match) return null;
  const label = match[1]!.trim();
  return isPracticeLabel(label) ? label : null;
}

function stopsFlow(line: string): boolean {
  const trimmed = line.trim();
  return (
    !trimmed ||
    trimmed === "---" ||
    line.startsWith("## ") ||
    line.startsWith("### ") ||
    line.startsWith("> ") ||
    line.trim() === ATTENTION_INSTRUMENT_TOKEN ||
    /^\d+\.\s/.test(line) ||
    /^-\s/.test(line)
  );
}

export function parseGuidebookChapter(raw: string): ChapterDocument {
  const lines = raw.replace(/\r\n/g, "\n").trim().split("\n");
  if (!lines[0]?.startsWith("# ")) {
    throw new Error("Chapter manuscript must begin with a top-level heading");
  }
  const title = lines[0].slice(2).trim();
  const blocks: ChapterBlock[] = [];
  const references: string[] = [];
  let i = 1;
  let inReferences = false;

  while (i < lines.length) {
    const line = lines[i]!;
    if (inReferences) {
      const trimmed = line.trim();
      if (trimmed) references.push(trimmed);
      i += 1;
      continue;
    }
    if (!line.trim()) {
      i += 1;
      continue;
    }
    if (line.trim() === "---") {
      blocks.push({ kind: "rule" });
      i += 1;
      continue;
    }
    if (line.trim() === ATTENTION_INSTRUMENT_TOKEN) {
      blocks.push({ kind: "attention" });
      i += 1;
      continue;
    }
    const practiceLabel = practiceHeading(line);
    if (practiceLabel) {
      const parsed = parsePracticeBlock(lines, i);
      blocks.push(parsed.block);
      i = parsed.nextIndex;
      if (i < lines.length && lines[i]!.trim() === "---") i += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      const heading = line.slice(3).trim();
      if (heading === "References") {
        inReferences = true;
        i += 1;
        continue;
      }
      blocks.push({ kind: "heading", text: heading });
      i += 1;
      continue;
    }
    if (line.startsWith("> ")) {
      const quoted: string[] = [];
      while (i < lines.length && lines[i]!.startsWith("> ")) {
        quoted.push(lines[i]!.slice(2).trim());
        i += 1;
      }
      blocks.push({ kind: "quote", text: quoted.join(" ") });
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i]!)) {
        items.push(lines[i]!.replace(/^\d+\.\s+/, "").trim());
        i += 1;
      }
      blocks.push({ kind: "list", items, ordered: true });
      continue;
    }
    if (/^-\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^-\s/.test(lines[i]!)) {
        items.push(lines[i]!.replace(/^-\s+/, "").trim());
        i += 1;
      }
      blocks.push({ kind: "list", items, ordered: false });
      continue;
    }
    const parts: string[] = [];
    while (i < lines.length) {
      const current = lines[i]!;
      if (stopsFlow(current) && current.trim() !== "") break;
      if (!current.trim()) break;
      parts.push(current.trim());
      i += 1;
    }
    const text = parts.join(" ");
    if (text.startsWith("**") && text.endsWith("**") && !text.slice(2, -2).includes("**")) {
      blocks.push({ kind: "emphasis", text: text.slice(2, -2) });
    } else if (text) {
      blocks.push({ kind: "paragraph", text });
    }
  }

  return { title, blocks, references };
}

function parseFlowUntil(
  lines: string[],
  start: number,
  shouldStop: (line: string) => boolean,
): { blocks: ChapterBlock[]; nextIndex: number } {
  const blocks: ChapterBlock[] = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i]!;
    if (shouldStop(line)) break;
    if (!line.trim()) {
      i += 1;
      continue;
    }
    if (line.trim() === "---") {
      blocks.push({ kind: "rule" });
      i += 1;
      continue;
    }
    if (line.trim() === ATTENTION_INSTRUMENT_TOKEN) {
      blocks.push({ kind: "attention" });
      i += 1;
      continue;
    }
    if (line.startsWith("### ")) {
      const text = line.slice(4).trim();
      if (!isPracticeLabel(text)) {
        blocks.push({ kind: "subheading", text });
        i += 1;
        continue;
      }
    }
    if (line.startsWith("> ")) {
      const quoted: string[] = [];
      while (i < lines.length && lines[i]!.startsWith("> ")) {
        quoted.push(lines[i]!.slice(2).trim());
        i += 1;
      }
      blocks.push({ kind: "quote", text: quoted.join(" ") });
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i]!)) {
        items.push(lines[i]!.replace(/^\d+\.\s+/, "").trim());
        i += 1;
      }
      blocks.push({ kind: "list", items, ordered: true });
      continue;
    }
    if (/^-\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^-\s/.test(lines[i]!)) {
        items.push(lines[i]!.replace(/^-\s+/, "").trim());
        i += 1;
      }
      blocks.push({ kind: "list", items, ordered: false });
      continue;
    }
    const parts: string[] = [];
    while (i < lines.length) {
      const current = lines[i]!;
      if (shouldStop(current)) break;
      if (!current.trim()) break;
      if (stopsFlow(current) && current.trim() !== "") break;
      parts.push(current.trim());
      i += 1;
    }
    const text = parts.join(" ");
    if (text.startsWith("**") && text.endsWith("**") && !text.slice(2, -2).includes("**")) {
      blocks.push({ kind: "emphasis", text: text.slice(2, -2) });
    } else if (text) {
      blocks.push({ kind: "paragraph", text });
    }
  }
  return { blocks, nextIndex: i };
}

function parsePracticeBlock(
  lines: string[],
  start: number,
): { block: Extract<ChapterBlock, { kind: "practice" }>; nextIndex: number } {
  const parts: PracticePart[] = [];
  let i = start;
  for (const expected of PRACTICE_LABELS) {
    const label = practiceHeading(lines[i] ?? "");
    if (label !== expected) {
      throw new Error(`Practice component must use ${PRACTICE_LABELS.join(", then ")} headings`);
    }
    i += 1;
    const parsed = parseFlowUntil(lines, i, (line) => {
      if (line.startsWith("## ")) return true;
      if (practiceHeading(line)) return true;
      if (line.trim() === "---") return true;
      return false;
    });
    parts.push({ label: expected, blocks: parsed.blocks });
    i = parsed.nextIndex;
  }
  return { block: { kind: "practice", parts }, nextIndex: i };
}

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter01(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter01Cache(): void {
  cached = null;
}
