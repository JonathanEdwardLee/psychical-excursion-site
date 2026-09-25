import { describe, expect, it } from "vitest";
import {
  CHAPTER_12_HASH,
  CHAPTER_12_PATH,
  CHAPTER_12_TITLE,
  loadGuidebookChapter12,
} from "./guidebookChapter12.ts";
import { parseGuidebookPublicPage } from "../ui/guidebookRoute.ts";

describe("Chapter 12 Feel the Shift manuscript", () => {
  it("locks title and public hash", () => {
    expect(CHAPTER_12_TITLE).toBe("Feel the Shift.");
    expect(CHAPTER_12_PATH).toBe("/feel-the-shift");
    expect(CHAPTER_12_HASH).toBe("#/feel-the-shift");
    expect(parseGuidebookPublicPage(CHAPTER_12_HASH)).toBe("chapter12");
  });

  it("parses the approved manuscript with Map the Shift and seven references", () => {
    const chapter = loadGuidebookChapter12();
    expect(chapter.title).toBe(CHAPTER_12_TITLE);
    expect(chapter.references).toHaveLength(7);
    const practice = chapter.blocks.filter((block) => block.kind === "practice");
    expect(practice).toHaveLength(1);
    const parts = practice[0]?.kind === "practice" ? practice[0].parts : [];
    expect(parts.map((part) => part.label)).toEqual(["Summary", "Experiment", "Intention"]);
    const experiment = parts.find((part) => part.label === "Experiment");
    const subheads = experiment?.blocks.filter((block) => block.kind === "subheading") ?? [];
    expect(subheads.map((block) => block.kind === "subheading" ? block.text : "")).toEqual([
      "Map the Shift",
    ]);
    const experimentText = JSON.stringify(experiment);
    expect(experimentText).toMatch(/Body sensation/);
    expect(experimentText).toMatch(/Movement/);
    expect(experimentText).toMatch(/Self-location/);
    expect(experimentText).toMatch(/Perspective/);
    expect(experimentText).toMatch(/Body ownership/);
    expect(experimentText).toMatch(/Environment/);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "Summary")).toBe(false);
    expect(chapter.blocks.some((block) => block.kind === "attention")).toBe(false);
    expect(JSON.stringify(chapter)).not.toMatch(/\bPEx\b/);
  });
});
