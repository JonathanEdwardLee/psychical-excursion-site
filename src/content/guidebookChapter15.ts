import source from "./guidebookChapter15.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_15_TITLE = "Explore the Dream.";
export const CHAPTER_15_PATH = "/explore-the-dream";
export const CHAPTER_15_HASH = `#${CHAPTER_15_PATH}`;

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter15(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter15Cache(): void {
  cached = null;
}
