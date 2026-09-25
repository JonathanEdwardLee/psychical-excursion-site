import { describe, expect, it } from "vitest";
import {
  CHAPTER_17_HASH,
  CHAPTER_17_PATH,
  CHAPTER_17_TITLE,
  loadGuidebookChapter17,
} from "./guidebookChapter17.ts";
import { parseGuidebookPublicPage } from "../ui/guidebookRoute.ts";

describe("Chapter 17 Cross the Threshold manuscript", () => {
  it("locks title and public hash", () => {
    expect(CHAPTER_17_TITLE).toBe(
      "Cross the Threshold: Astral Projection, OBE Techniques and Lucid Dreaming",
    );
    expect(CHAPTER_17_PATH).toBe("/astral-projection-obe-techniques/");
    expect(CHAPTER_17_HASH).toBe("/astral-projection-obe-techniques/");
    expect(parseGuidebookPublicPage(CHAPTER_17_HASH)).toBe("chapter17");
    expect(parseGuidebookPublicPage("#/cross-the-threshold")).toBe("chapter17");
  });

  it("parses the approved manuscript with Choose One Door, six subheadings, and eleven references", () => {
    const chapter = loadGuidebookChapter17();
    expect(chapter.title).toBe(CHAPTER_17_TITLE);
    expect(chapter.references).toHaveLength(11);
    const practice = chapter.blocks.filter((block) => block.kind === "practice");
    expect(practice).toHaveLength(1);
    const parts = practice[0]?.kind === "practice" ? practice[0].parts : [];
    expect(parts.map((part) => part.label)).toEqual(["Summary", "Experiment", "Intention"]);
    const experiment = parts.find((part) => part.label === "Experiment");
    const subheads = experiment?.blocks.filter((block) => block.kind === "subheading") ?? [];
    expect(subheads.map((block) => (block.kind === "subheading" ? block.text : ""))).toEqual([
      "Choose One Door",
      "Lucid route",
      "Imagined movement route",
      "Sleep-edge route",
      "MILD / SSILD route",
      "Natural sleep-paralysis route",
      "Record the crossing",
    ]);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "Summary")).toBe(false);
    expect(chapter.blocks.some((block) => block.kind === "attention")).toBe(false);
    expect(JSON.stringify(chapter)).not.toMatch(/\bPEx\b/);
    expect(JSON.stringify(chapter)).not.toMatch(/literal astral separation is scientifically established/i);
  });
});
