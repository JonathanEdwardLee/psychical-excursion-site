import { describe, expect, it } from "vitest";
import {
  CHAPTER_16_HASH,
  CHAPTER_16_PATH,
  CHAPTER_16_TITLE,
  loadGuidebookChapter16,
} from "./guidebookChapter16.ts";
import { parseGuidebookPublicPage } from "../ui/guidebookRoute.ts";

describe("Chapter 16 Loosen the Body manuscript", () => {
  it("locks title and public hash", () => {
    expect(CHAPTER_16_TITLE).toBe(
      "Loosen the Body: Body Ownership, Self-Location and Out-of-Body Experience",
    );
    expect(CHAPTER_16_PATH).toBe("/out-of-body-experience-body-ownership/");
    expect(CHAPTER_16_HASH).toBe("/out-of-body-experience-body-ownership/");
    expect(parseGuidebookPublicPage(CHAPTER_16_HASH)).toBe("chapter16");
    expect(parseGuidebookPublicPage("#/loosen-the-body")).toBe("chapter16");
  });

  it("parses the approved manuscript with Loosen the Map, five subheadings, and ten references", () => {
    const chapter = loadGuidebookChapter16();
    expect(chapter.title).toBe(CHAPTER_16_TITLE);
    expect(chapter.references).toHaveLength(10);
    const practice = chapter.blocks.filter((block) => block.kind === "practice");
    expect(practice).toHaveLength(1);
    const parts = practice[0]?.kind === "practice" ? practice[0].parts : [];
    expect(parts.map((part) => part.label)).toEqual(["Summary", "Experiment", "Intention"]);
    const experiment = parts.find((part) => part.label === "Experiment");
    const subheads = experiment?.blocks.filter((block) => block.kind === "subheading") ?? [];
    expect(subheads.map((block) => (block.kind === "subheading" ? block.text : ""))).toEqual([
      "Loosen the Map",
      "Ownership",
      "Location",
      "Perspective",
      "Movement",
      "Compare the components",
    ]);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "Summary")).toBe(false);
    expect(chapter.blocks.some((block) => block.kind === "attention")).toBe(false);
    expect(JSON.stringify(chapter)).not.toMatch(/\bPEx\b/);
    expect(JSON.stringify(chapter)).not.toMatch(/proves consciousness left the body|literal separation is proven/i);
  });
});
