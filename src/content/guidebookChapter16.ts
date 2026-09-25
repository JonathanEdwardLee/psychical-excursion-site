import source from "./guidebookChapter16.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_16_TITLE = "Loosen the Body: Body Ownership, Self-Location and Out-of-Body Experience";
export const CHAPTER_16_PATH = "/out-of-body-experience-body-ownership/";
export const CHAPTER_16_HASH = CHAPTER_16_PATH;

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter16(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter16Cache(): void {
  cached = null;
}
