import source from "./guidebookChapter11.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_11_TITLE = "Move Without Moving: Motor Imagery, Dream Movement and Sleep-Onset Practice";
export const CHAPTER_11_PATH = "/motor-imagery-lucid-dreaming/";
export const CHAPTER_11_HASH = CHAPTER_11_PATH;

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter11(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter11Cache(): void {
  cached = null;
}
