import source from "./guidebookChapter04.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_04_TITLE = "Feel the Body.";
export const CHAPTER_04_PATH = "/feel-the-body";
export const CHAPTER_04_HASH = `#${CHAPTER_04_PATH}`;

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter04(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter04Cache(): void {
  cached = null;
}
