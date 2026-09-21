import source from "./guidebookManuscript.source.md?raw";

export const GUIDEBOOK_SUBTITLE =
  "An experiment in dreams, consciousness, energy, and out-of-body experience";

export type GuidebookSection = {
  heading: string;
  paragraphs: string[];
};

export type GuidebookManuscript = {
  openingHeading: string;
  openingParagraphs: string[];
  sections: GuidebookSection[];
  references: string[];
};

export function parseGuidebookManuscript(raw: string): GuidebookManuscript {
  const trimmed = raw.trim();
  const headingMatch = trimmed.match(/^#\s+(.+)\n+/);
  if (!headingMatch) {
    throw new Error("Guidebook manuscript must begin with a top-level heading");
  }
  const openingHeading = headingMatch[1]!.trim();
  const body = trimmed.slice(headingMatch[0].length);
  const chunks = body.split(/\n## /);
  const openingParagraphs = splitParagraphs(chunks[0] ?? "");
  const sections: GuidebookSection[] = [];
  let references: string[] = [];
  for (let i = 1; i < chunks.length; i += 1) {
    const chunk = chunks[i]!;
    const lineBreak = chunk.indexOf("\n");
    const heading = (lineBreak === -1 ? chunk : chunk.slice(0, lineBreak)).trim();
    const rest = lineBreak === -1 ? "" : chunk.slice(lineBreak + 1);
    if (heading === "References") {
      references = splitReferenceLines(rest);
      continue;
    }
    sections.push({ heading, paragraphs: splitParagraphs(rest) });
  }
  return { openingHeading, openingParagraphs, sections, references };
}

function splitParagraphs(block: string): string[] {
  return block
    .split(/\n---\n/)
    .flatMap((part) => part.split(/\n\n+/))
    .map((paragraph) => paragraph.replace(/\n/g, " ").trim())
    .filter(Boolean);
}

function splitReferenceLines(block: string): string[] {
  return block
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

let cached: GuidebookManuscript | null = null;

export function loadGuidebookManuscript(): GuidebookManuscript {
  if (!cached) cached = parseGuidebookManuscript(source);
  return cached;
}
