import source from "./guidebookChapter09.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_09_TITLE = "Watch the Edge: Hypnagogia and the Transition Into Lucid Dreaming";
export const CHAPTER_09_PATH = "/hypnagogia-lucid-dreaming/";
export const CHAPTER_09_HASH = CHAPTER_09_PATH;

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter09(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter09Cache(): void {
  cached = null;
}
