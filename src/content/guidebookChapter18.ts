import source from "./guidebookChapter18.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_18_TITLE = "Test the Experience: Can Lucid Dreams and Out-of-Body Experiences Be Verified?";
export const CHAPTER_18_PATH = "/testing-out-of-body-experiences/";
export const CHAPTER_18_HASH = CHAPTER_18_PATH;

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter18(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter18Cache(): void {
  cached = null;
}
