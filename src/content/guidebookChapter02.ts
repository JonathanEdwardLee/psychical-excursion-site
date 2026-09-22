import source from "./guidebookChapter02.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_02_TITLE = "You Are Dreaming. Notice.";
export const CHAPTER_02_PATH = "/you-are-dreaming-notice";
export const CHAPTER_02_HASH = `#${CHAPTER_02_PATH}`;

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter02(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter02Cache(): void {
  cached = null;
}
