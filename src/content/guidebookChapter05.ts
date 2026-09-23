import source from "./guidebookChapter05.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_05_TITLE = "Move Your Attention.";
export const CHAPTER_05_PATH = "/move-your-attention";
export const CHAPTER_05_HASH = `#${CHAPTER_05_PATH}`;
export const CHAPTER_05_PLACEHOLDER_MARKER = "PEX-IMPLEMENTATION-PLACEHOLDER";

let cached: ChapterDocument | null = null;

/** True only after PEX_PRIMARY replaces the placeholder source with the approved manuscript. */
export function isGuidebookChapter05Ready(): boolean {
  const raw = source.trim();
  if (!raw || raw.includes(CHAPTER_05_PLACEHOLDER_MARKER)) return false;
  return raw.startsWith(`# ${CHAPTER_05_TITLE}`);
}

export function loadGuidebookChapter05(): ChapterDocument {
  if (!isGuidebookChapter05Ready()) {
    throw new Error("Chapter 5 manuscript has not been supplied by PEX_PRIMARY");
  }
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter05Cache(): void {
  cached = null;
}
