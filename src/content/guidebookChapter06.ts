import source from "./guidebookChapter06.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_06_TITLE = "Build the Current.";
export const CHAPTER_06_PATH = "/build-the-current";
export const CHAPTER_06_HASH = `#${CHAPTER_06_PATH}`;

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter06(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter06Cache(): void {
  cached = null;
}
