import source from "./guidebookChapter20.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_20_TITLE = "Floating in Space: Sun, Moon, Planets and the Science of Sleep & Dreams";
export const CHAPTER_20_PATH = "/sun-moon-planets-sleep-dreams/";
export const CHAPTER_20_HASH = CHAPTER_20_PATH;

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter20(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter20Cache(): void {
  cached = null;
}
