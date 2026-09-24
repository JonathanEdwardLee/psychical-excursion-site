import source from "./guidebookChapter07.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_07_TITLE = "Quiet the Mind.";
export const CHAPTER_07_PATH = "/quiet-the-mind";
export const CHAPTER_07_HASH = `#${CHAPTER_07_PATH}`;

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter07(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter07Cache(): void {
  cached = null;
}
