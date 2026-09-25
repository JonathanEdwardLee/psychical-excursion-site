import source from "./guidebookChapter10.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_10_TITLE = "Let the Body Sleep: The “Mind Awake, Body Asleep” Route to Lucid Dreaming";
export const CHAPTER_10_PATH = "/mind-awake-body-asleep/";
export const CHAPTER_10_HASH = CHAPTER_10_PATH;

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter10(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter10Cache(): void {
  cached = null;
}
