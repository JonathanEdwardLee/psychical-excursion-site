import { describe, expect, it } from "vitest";
import {
  CHAPTER_15_HASH,
  CHAPTER_15_PATH,
  CHAPTER_15_TITLE,
  loadGuidebookChapter15,
} from "./guidebookChapter15.ts";
import { parseGuidebookPublicPage } from "../ui/guidebookRoute.ts";

describe("Chapter 15 Explore the Dream manuscript", () => {
  it("locks title and public hash", () => {
    expect(CHAPTER_15_TITLE).toBe("Explore the Dream: Lucid Dream Experiments, Dream Control and Research");
    expect(CHAPTER_15_PATH).toBe("/lucid-dream-experiments/");
    expect(CHAPTER_15_HASH).toBe("/lucid-dream-experiments/");
    expect(parseGuidebookPublicPage(CHAPTER_15_HASH)).toBe("chapter15");
  });

  it("parses the approved manuscript with One Question and ten references", () => {
    const chapter = loadGuidebookChapter15();
    expect(chapter.title).toBe(CHAPTER_15_TITLE);
    expect(chapter.references).toHaveLength(10);
    const practice = chapter.blocks.filter((block) => block.kind === "practice");
    expect(practice).toHaveLength(1);
    const parts = practice[0]?.kind === "practice" ? practice[0].parts : [];
    expect(parts.map((part) => part.label)).toEqual(["Summary", "Experiment", "Intention"]);
    const experiment = parts.find((part) => part.label === "Experiment");
    const subheads = experiment?.blocks.filter((block) => block.kind === "subheading") ?? [];
    expect(subheads.map((block) => block.kind === "subheading" ? block.text : "")).toEqual([
      "One Question",
      "Observe first",
      "Ask",
      "Separate surprise from interpretation",
      "Check memory",
      "External verification",
      "Problem exploration",
    ]);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "Summary")).toBe(false);
    expect(chapter.blocks.some((block) => block.kind === "attention")).toBe(false);
    expect(JSON.stringify(chapter)).not.toMatch(/\bPEx\b/);
    expect(JSON.stringify(chapter)).not.toMatch(/dream characters are independent consciousness|dream answers are external facts|proves paranormal/i);
  });
});
