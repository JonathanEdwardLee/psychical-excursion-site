import { describe, expect, it } from "vitest";
import {
  CHAPTER_14_HASH,
  CHAPTER_14_PATH,
  CHAPTER_14_TITLE,
  loadGuidebookChapter14,
} from "./guidebookChapter14.ts";
import { parseGuidebookPublicPage } from "../ui/guidebookRoute.ts";

describe("Chapter 14 Stabilize the Dream manuscript", () => {
  it("locks title and public hash", () => {
    expect(CHAPTER_14_TITLE).toBe("Stabilize the Dream.");
    expect(CHAPTER_14_PATH).toBe("/stabilize-the-dream");
    expect(CHAPTER_14_HASH).toBe("#/stabilize-the-dream");
    expect(parseGuidebookPublicPage(CHAPTER_14_HASH)).toBe("chapter14");
  });

  it("parses the approved manuscript with Stay in the Scene and nine references", () => {
    const chapter = loadGuidebookChapter14();
    expect(chapter.title).toBe(CHAPTER_14_TITLE);
    expect(chapter.references).toHaveLength(9);
    const practice = chapter.blocks.filter((block) => block.kind === "practice");
    expect(practice).toHaveLength(1);
    const parts = practice[0]?.kind === "practice" ? practice[0].parts : [];
    expect(parts.map((part) => part.label)).toEqual(["Summary", "Experiment", "Intention"]);
    const experiment = parts.find((part) => part.label === "Experiment");
    const subheads = experiment?.blocks.filter((block) => block.kind === "subheading") ?? [];
    expect(subheads.map((block) => block.kind === "subheading" ? block.text : "")).toEqual([
      "Stay in the Scene",
      "Touch",
      "Look",
      "Move",
      "Speak",
      "No intervention",
    ]);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "Summary")).toBe(false);
    expect(chapter.blocks.some((block) => block.kind === "attention")).toBe(false);
    expect(JSON.stringify(chapter)).not.toMatch(/\bPEx\b/);
    expect(JSON.stringify(chapter)).not.toMatch(/guaranteed to stabilize|always prevents fading|proves that consciousness leaves/i);
  });
});
