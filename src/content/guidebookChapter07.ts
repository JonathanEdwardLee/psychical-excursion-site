import source from "./guidebookChapter07.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_07_TITLE = "Quiet the Mind: Meditation Techniques for Sleep and Dream Awareness";
export const CHAPTER_07_PATH = "/meditation-for-lucid-dreaming/";
export const CHAPTER_07_HASH = CHAPTER_07_PATH;

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter07(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter07Cache(): void {
  cached = null;
}
