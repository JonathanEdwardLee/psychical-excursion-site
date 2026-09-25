import source from "./guidebookChapter08.source.md?raw";
import { parseGuidebookChapter, type ChapterDocument } from "./guidebookChapter01.ts";

export const CHAPTER_08_TITLE = "See the Image: Visualization, Mental Imagery and Hypnagogic Imagery";
export const CHAPTER_08_PATH = "/visualization-hypnagogic-imagery/";
export const CHAPTER_08_HASH = CHAPTER_08_PATH;

let cached: ChapterDocument | null = null;

export function loadGuidebookChapter08(): ChapterDocument {
  if (!cached) cached = parseGuidebookChapter(source);
  return cached;
}

export function resetGuidebookChapter08Cache(): void {
  cached = null;
}
