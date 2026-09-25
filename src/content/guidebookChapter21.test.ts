import { describe, expect, it } from "vitest";
import {
  CHAPTER_21_HASH,
  CHAPTER_21_PATH,
  CHAPTER_21_TITLE,
  loadGuidebookChapter21,
} from "./guidebookChapter21.ts";
import { parseGuidebookPublicPage } from "../ui/guidebookRoute.ts";

describe("Chapter 21 Notice the Coincidence manuscript", () => {
  it("locks title and public hash", () => {
    expect(CHAPTER_21_TITLE).toBe(
      "Notice the Coincidence: Synchronicity, Recurring Dreams, Shared Dreams and Pattern Recognition",
    );
    expect(CHAPTER_21_PATH).toBe("/synchronicity-recurring-shared-dreams/");
    expect(CHAPTER_21_HASH).toBe("/synchronicity-recurring-shared-dreams/");
    expect(parseGuidebookPublicPage(CHAPTER_21_HASH)).toBe("chapter21");
    expect(parseGuidebookPublicPage("#/notice-the-coincidence")).toBe("chapter21");
  });

  it("parses the approved manuscript with Make the Coincidence Earn It, seven subheadings, and nine references", () => {
    const chapter = loadGuidebookChapter21();
    expect(chapter.title).toBe(CHAPTER_21_TITLE);
    expect(chapter.references).toHaveLength(9);
    const practice = chapter.blocks.filter((block) => block.kind === "practice");
    expect(practice).toHaveLength(1);
    const parts = practice[0]?.kind === "practice" ? practice[0].parts : [];
    expect(parts.map((part) => part.label)).toEqual(["Summary", "Experiment", "Intention"]);
    const experiment = parts.find((part) => part.label === "Experiment");
    const subheads = experiment?.blocks.filter((block) => block.kind === "subheading") ?? [];
    expect(subheads.map((block) => (block.kind === "subheading" ? block.text : ""))).toEqual([
      "Make the Coincidence Earn It",
      "Choose a symbol",
      "Track recurring characters",
      "Map recurring places",
      "Try a mutual-dream protocol",
      "Compare characters and places",
      "Keep the misses",
      "Ask what it meant anyway",
    ]);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "Summary")).toBe(false);
    expect(chapter.blocks.some((block) => block.kind === "attention")).toBe(false);
    expect(JSON.stringify(chapter)).not.toMatch(/\bPEx\b/);
    expect(JSON.stringify(chapter)).not.toMatch(/finding this website proves destiny/i);
    expect(JSON.stringify(chapter)).not.toMatch(/dream telepathy is established/i);
  });
});
