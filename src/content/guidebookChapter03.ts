import source from "./guidebookChapter03.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_03_TITLE = "You Are Dreaming. Recognize.";
export const CHAPTER_03_PATH = "/you-are-dreaming-recognize";
export const CHAPTER_03_HASH = `#${CHAPTER_03_PATH}`;
export const CHAPTER_03_PLACEHOLDER_MARKER = "PEX-IMPLEMENTATION-PLACEHOLDER";

let cached: ChapterDocument | null = null;

/** True only after PEX_PRIMARY replaces the placeholder source with the approved manuscript. */
export function isGuidebookChapter03Ready(): boolean {
  const raw = source.trim();
  if (!raw || raw.includes(CHAPTER_03_PLACEHOLDER_MARKER)) return false;
  return raw.startsWith(`# ${CHAPTER_03_TITLE}`);
}

export function loadGuidebookChapter03(): ChapterDocument {
  if (!isGuidebookChapter03Ready()) {
    throw new Error("Chapter 3 manuscript has not been supplied by PEX_PRIMARY");
  }
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter03Cache(): void {
  cached = null;
}
