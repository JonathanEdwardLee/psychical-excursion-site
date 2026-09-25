import source from "./guidebookChapter13.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_13_TITLE = "Know the Threshold: How to Recognize When Waking Imagery Becomes a Dream";
export const CHAPTER_13_PATH = "/entering-a-lucid-dream/";
export const CHAPTER_13_HASH = CHAPTER_13_PATH;

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter13(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter13Cache(): void {
  cached = null;
}
