import { describe, expect, it } from "vitest";
import {
  CHAPTER_08_HASH,
  CHAPTER_08_PATH,
  CHAPTER_08_TITLE,
  loadGuidebookChapter08,
} from "./guidebookChapter08.ts";
import { parseGuidebookPublicPage } from "../ui/guidebookRoute.ts";

describe("Chapter 8 See the Image manuscript", () => {
  it("locks title and public hash", () => {
    expect(CHAPTER_08_TITLE).toBe("See the Image.");
    expect(CHAPTER_08_PATH).toBe("/see-the-image");
    expect(CHAPTER_08_HASH).toBe("#/see-the-image");
    expect(parseGuidebookPublicPage(CHAPTER_08_HASH)).toBe("chapter08");
  });

  it("parses the approved manuscript with practice parts, experiment subheadings, and nine references", () => {
    const chapter = loadGuidebookChapter08();
    expect(chapter.title).toBe(CHAPTER_08_TITLE);
    expect(chapter.references).toHaveLength(9);
    const practice = chapter.blocks.filter((block) => block.kind === "practice");
    expect(practice).toHaveLength(1);
    const parts = practice[0]?.kind === "practice" ? practice[0].parts : [];
    expect(parts.map((part) => part.label)).toEqual(["Summary", "Experiment", "Intention"]);
    const experiment = parts.find((part) => part.label === "Experiment");
    const subheads = experiment?.blocks.filter((block) => block.kind === "subheading") ?? [];
    expect(subheads.map((block) => block.kind === "subheading" ? block.text : "")).toEqual([
      "Part One — Construct",
      "Part Two — Receive",
    ]);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "Summary")).toBe(false);
    expect(chapter.blocks.some((block) => block.kind === "attention")).toBe(false);
    expect(JSON.stringify(chapter)).not.toMatch(/\bPEx\b/);
  });
});
