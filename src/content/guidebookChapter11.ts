import source from "./guidebookChapter11.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_11_TITLE = "Move Without Moving.";
export const CHAPTER_11_PATH = "/move-without-moving";
export const CHAPTER_11_HASH = `#${CHAPTER_11_PATH}`;

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter11(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter11Cache(): void {
  cached = null;
}
