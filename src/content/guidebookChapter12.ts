import source from "./guidebookChapter12.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_12_TITLE = "Feel the Shift.";
export const CHAPTER_12_PATH = "/feel-the-shift";
export const CHAPTER_12_HASH = `#${CHAPTER_12_PATH}`;

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter12(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter12Cache(): void {
  cached = null;
}
