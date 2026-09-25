import source from "./guidebookChapter21.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_21_TITLE = "Notice the Coincidence: Synchronicity, Recurring Dreams, Shared Dreams and Pattern Recognition";
export const CHAPTER_21_PATH = "/synchronicity-recurring-shared-dreams/";
export const CHAPTER_21_HASH = CHAPTER_21_PATH;

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter21(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter21Cache(): void {
  cached = null;
}
