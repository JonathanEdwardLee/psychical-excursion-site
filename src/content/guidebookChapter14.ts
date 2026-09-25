import source from "./guidebookChapter14.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_14_TITLE = "Stabilize the Dream.";
export const CHAPTER_14_PATH = "/stabilize-the-dream";
export const CHAPTER_14_HASH = `#${CHAPTER_14_PATH}`;

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter14(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter14Cache(): void {
  cached = null;
}
