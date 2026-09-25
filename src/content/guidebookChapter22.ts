import source from "./guidebookChapter22.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_22_TITLE = "Return. Record. Repeat: The Best Bedtime Routine for Lucid Dreaming and Astral Projection";
export const CHAPTER_22_PATH = "/lucid-dreaming-astral-projection-bedtime-routine/";
export const CHAPTER_22_HASH = CHAPTER_22_PATH;

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter22(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter22Cache(): void {
  cached = null;
}
