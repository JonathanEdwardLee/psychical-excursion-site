import { describe, expect, it } from "vitest";
import {
  CHAPTER_13_HASH,
  CHAPTER_13_PATH,
  CHAPTER_13_TITLE,
  loadGuidebookChapter13,
} from "./guidebookChapter13.ts";
import { parseGuidebookPublicPage } from "../ui/guidebookRoute.ts";

describe("Chapter 13 Know the Threshold manuscript", () => {
  it("locks title and public hash", () => {
    expect(CHAPTER_13_TITLE).toBe("Know the Threshold: How to Recognize When Waking Imagery Becomes a Dream");
    expect(CHAPTER_13_PATH).toBe("/entering-a-lucid-dream/");
    expect(CHAPTER_13_HASH).toBe("/entering-a-lucid-dream/");
    expect(parseGuidebookPublicPage(CHAPTER_13_HASH)).toBe("chapter13");
  });

  it("parses the approved manuscript with Catch the Crossing and eight references", () => {
    const chapter = loadGuidebookChapter13();
    expect(chapter.title).toBe(CHAPTER_13_TITLE);
    expect(chapter.references).toHaveLength(8);
    const practice = chapter.blocks.filter((block) => block.kind === "practice");
    expect(practice).toHaveLength(1);
    const parts = practice[0]?.kind === "practice" ? practice[0].parts : [];
    expect(parts.map((part) => part.label)).toEqual(["Summary", "Experiment", "Intention"]);
    const experiment = parts.find((part) => part.label === "Experiment");
    const subheads = experiment?.blocks.filter((block) => block.kind === "subheading") ?? [];
    expect(subheads.map((block) => block.kind === "subheading" ? block.text : "")).toEqual([
      "Catch the Crossing",
      "The outside",
      "The inside",
      "The observer",
    ]);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "Summary")).toBe(false);
    expect(chapter.blocks.some((block) => block.kind === "attention")).toBe(false);
    expect(JSON.stringify(chapter)).not.toMatch(/\bPEx\b/);
    expect(JSON.stringify(chapter)).not.toMatch(/you are in N1|this is REM|this proves lucid REM/i);
  });
});
