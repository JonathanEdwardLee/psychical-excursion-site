import { describe, expect, it } from "vitest";
import {
  CHAPTER_19_HASH,
  CHAPTER_19_PATH,
  CHAPTER_19_TITLE,
  loadGuidebookChapter19,
} from "./guidebookChapter19.ts";
import { parseGuidebookPublicPage } from "../ui/guidebookRoute.ts";

describe("Chapter 19 Compare the Maps manuscript", () => {
  it("locks title and public hash", () => {
    expect(CHAPTER_19_TITLE).toBe(
      "Compare the Maps: Lucid Dreaming vs. Astral Projection, OBE and Sleep Paralysis",
    );
    expect(CHAPTER_19_PATH).toBe("/lucid-dreaming-vs-astral-projection/");
    expect(CHAPTER_19_HASH).toBe("/lucid-dreaming-vs-astral-projection/");
    expect(parseGuidebookPublicPage(CHAPTER_19_HASH)).toBe("chapter19");
    expect(parseGuidebookPublicPage("#/compare-the-maps")).toBe("chapter19");
  });

  it("parses the approved manuscript with Map One Experience Five Ways, six subheadings, and nine references", () => {
    const chapter = loadGuidebookChapter19();
    expect(chapter.title).toBe(CHAPTER_19_TITLE);
    expect(chapter.references).toHaveLength(9);
    const practice = chapter.blocks.filter((block) => block.kind === "practice");
    expect(practice).toHaveLength(1);
    const parts = practice[0]?.kind === "practice" ? practice[0].parts : [];
    expect(parts.map((part) => part.label)).toEqual(["Summary", "Experiment", "Intention"]);
    const experiment = parts.find((part) => part.label === "Experiment");
    const subheads = experiment?.blocks.filter((block) => block.kind === "subheading") ?? [];
    expect(subheads.map((block) => (block.kind === "subheading" ? block.text : ""))).toEqual([
      "Map One Experience Five Ways",
      "Lucid-dream map",
      "Sleep-paralysis map",
      "OBE map",
      "Astral-projection map",
      "Verification map",
      "Compare",
    ]);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "Summary")).toBe(false);
    expect(chapter.blocks.some((block) => block.kind === "attention")).toBe(false);
    expect(JSON.stringify(chapter)).not.toMatch(/\bPEx\b/);
    expect(JSON.stringify(chapter)).not.toMatch(/scientifically established literal travel/i);
  });
});
