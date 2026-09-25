import source from "./guidebookChapter19.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_19_TITLE = "Compare the Maps: Lucid Dreaming vs. Astral Projection, OBE and Sleep Paralysis";
export const CHAPTER_19_PATH = "/lucid-dreaming-vs-astral-projection/";
export const CHAPTER_19_HASH = CHAPTER_19_PATH;

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter19(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter19Cache(): void {
  cached = null;
}
