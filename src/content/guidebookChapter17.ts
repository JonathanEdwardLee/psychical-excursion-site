import source from "./guidebookChapter17.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_17_TITLE = "Cross the Threshold: Astral Projection, OBE Techniques and Lucid Dreaming";
export const CHAPTER_17_PATH = "/astral-projection-obe-techniques/";
export const CHAPTER_17_HASH = CHAPTER_17_PATH;

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter17(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter17Cache(): void {
  cached = null;
}
