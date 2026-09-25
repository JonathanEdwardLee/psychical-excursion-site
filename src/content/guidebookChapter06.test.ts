import { describe, expect, it } from "vitest";
import {
  CHAPTER_06_HASH,
  CHAPTER_06_PATH,
  CHAPTER_06_TITLE,
  loadGuidebookChapter06,
} from "./guidebookChapter06.ts";
import { parseGuidebookPublicPage } from "../ui/guidebookRoute.ts";

describe("Chapter 6 Build the Current manuscript", () => {
  it("locks title and public hash", () => {
    expect(CHAPTER_06_TITLE).toBe("Build the Current: Tingling, Energy Sensations and Focused Attention");
    expect(CHAPTER_06_PATH).toBe("/energy-sensations-meditation/");
    expect(CHAPTER_06_HASH).toBe("/energy-sensations-meditation/");
    expect(parseGuidebookPublicPage(CHAPTER_06_HASH)).toBe("chapter06");
  });

  it("parses the approved manuscript with one practice component and four references", () => {
    const chapter = loadGuidebookChapter06();
    expect(chapter.title).toBe(CHAPTER_06_TITLE);
    expect(chapter.references).toHaveLength(4);
    const practice = chapter.blocks.filter((block) => block.kind === "practice");
    expect(practice).toHaveLength(1);
    const parts = practice[0]?.kind === "practice" ? practice[0].parts : [];
    expect(parts.map((part) => part.label)).toEqual(["Summary", "Experiment", "Intention"]);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "Summary")).toBe(false);
    expect(chapter.blocks.some((block) => block.kind === "attention")).toBe(false);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "From Movement to Current")).toBe(true);
  });
});
