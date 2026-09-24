import { describe, expect, it } from "vitest";
import {
  CHAPTER_11_HASH,
  CHAPTER_11_PATH,
  CHAPTER_11_TITLE,
  loadGuidebookChapter11,
} from "./guidebookChapter11.ts";
import { parseGuidebookPublicPage } from "../ui/guidebookRoute.ts";

describe("Chapter 11 Move Without Moving manuscript", () => {
  it("locks title and public hash", () => {
    expect(CHAPTER_11_TITLE).toBe("Move Without Moving.");
    expect(CHAPTER_11_PATH).toBe("/move-without-moving");
    expect(CHAPTER_11_HASH).toBe("#/move-without-moving");
    expect(parseGuidebookPublicPage(CHAPTER_11_HASH)).toBe("chapter11");
  });

  it("parses the approved manuscript with three Experiment subheadings and five references", () => {
    const chapter = loadGuidebookChapter11();
    expect(chapter.title).toBe(CHAPTER_11_TITLE);
    expect(chapter.references).toHaveLength(5);
    const practice = chapter.blocks.filter((block) => block.kind === "practice");
    expect(practice).toHaveLength(1);
    const parts = practice[0]?.kind === "practice" ? practice[0].parts : [];
    expect(parts.map((part) => part.label)).toEqual(["Summary", "Experiment", "Intention"]);
    const experiment = parts.find((part) => part.label === "Experiment");
    const subheads = experiment?.blocks.filter((block) => block.kind === "subheading") ?? [];
    expect(subheads.map((block) => block.kind === "subheading" ? block.text : "")).toEqual([
      "Part One — Move, Then Remember",
      "Part Two — Move the Whole Body Without Moving",
      "Part Three — Stop Directing",
    ]);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "Summary")).toBe(false);
    expect(chapter.blocks.some((block) => block.kind === "attention")).toBe(false);
    expect(JSON.stringify(chapter)).not.toMatch(/\bPEx\b/);
  });
});
