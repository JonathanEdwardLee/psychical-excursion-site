import source from "./guidebookChapter01.source.md?raw";

export const CHAPTER_01_TITLE = "You Are Dreaming. Remember.";
export const CHAPTER_01_PATH = "/you-are-dreaming-remember";
export const CHAPTER_01_HASH = `#${CHAPTER_01_PATH}`;

export type ChapterBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "emphasis"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "rule" };

export type ChapterDocument = {
  title: string;
  blocks: ChapterBlock[];
  references: string[];
};

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
      blocks.push({ kind: "list", items });
      continue;
    }
    const parts: string[] = [];
    while (i < lines.length) {
      const current = lines[i]!;
      if (!current.trim()) break;
      if (current.trim() === "---") break;
      if (current.startsWith("## ") || current.startsWith("> ") || /^\d+\.\s/.test(current)) break;
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

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter01(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter01Cache(): void {
  cached = null;
}
