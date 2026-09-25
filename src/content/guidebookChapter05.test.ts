import { describe, expect, it } from "vitest";
import {
  CHAPTER_05_HASH,
  CHAPTER_05_PATH,
  CHAPTER_05_PLACEHOLDER_MARKER,
  CHAPTER_05_TITLE,
  isGuidebookChapter05Ready,
  loadGuidebookChapter05,
} from "./guidebookChapter05.ts";

describe("Chapter 5 Move Your Attention", () => {
  it("publishes the approved manuscript", () => {
    expect(CHAPTER_05_TITLE).toBe("Move Your Attention: Focused Attention and Body Awareness Meditation");
    expect(CHAPTER_05_HASH).toBe("/attention-body-awareness/");
    expect(CHAPTER_05_PATH).toBe("/attention-body-awareness/");
    expect(isGuidebookChapter05Ready()).toBe(true);
    const chapter = loadGuidebookChapter05();
    expect(chapter.title).toBe(CHAPTER_05_TITLE);
    expect(chapter.blocks.some((block) => block.kind === "attention")).toBe(true);
    expect(chapter.blocks.some((block) => block.kind === "practice")).toBe(true);
    expect(chapter.references).toHaveLength(5);
    expect(JSON.stringify(chapter)).not.toContain(CHAPTER_05_PLACEHOLDER_MARKER);
  });
});
