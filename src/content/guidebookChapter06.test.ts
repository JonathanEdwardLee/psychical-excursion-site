import { describe, expect, it } from "vitest";
import {
  CHAPTER_06_HASH,
  CHAPTER_06_PATH,
  CHAPTER_06_TITLE,
  loadGuidebookChapter06,
} from "./guidebookChapter06.ts";

describe("Chapter 6 Build the Current", () => {
  it("publishes the approved manuscript", () => {
    expect(CHAPTER_06_TITLE).toBe("Build the Current.");
    expect(CHAPTER_06_HASH).toBe("#/build-the-current");
    expect(CHAPTER_06_PATH).toBe("/build-the-current");
    const chapter = loadGuidebookChapter06();
    expect(chapter.title).toBe(CHAPTER_06_TITLE);
    expect(chapter.blocks.filter((block) => block.kind === "practice")).toHaveLength(1);
    expect(chapter.blocks.some((block) => block.kind === "attention")).toBe(false);
    expect(chapter.references).toHaveLength(4);
  });
});
