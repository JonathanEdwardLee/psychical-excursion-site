import source from "./guidebookChapter13.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_13_TITLE = "Know the Threshold.";
export const CHAPTER_13_PATH = "/know-the-threshold";
export const CHAPTER_13_HASH = `#${CHAPTER_13_PATH}`;

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter13(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter13Cache(): void {
  cached = null;
}
