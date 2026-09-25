import { describe, expect, it } from "vitest";
import {
  CHAPTER_18_HASH,
  CHAPTER_18_PATH,
  CHAPTER_18_TITLE,
  loadGuidebookChapter18,
} from "./guidebookChapter18.ts";
import { parseGuidebookPublicPage } from "../ui/guidebookRoute.ts";

describe("Chapter 18 Test the Experience manuscript", () => {
  it("locks title and public hash", () => {
    expect(CHAPTER_18_TITLE).toBe(
      "Test the Experience: Can Lucid Dreams and Out-of-Body Experiences Be Verified?",
    );
    expect(CHAPTER_18_PATH).toBe("/testing-out-of-body-experiences/");
    expect(CHAPTER_18_HASH).toBe("/testing-out-of-body-experiences/");
    expect(parseGuidebookPublicPage(CHAPTER_18_HASH)).toBe("chapter18");
    expect(parseGuidebookPublicPage("#/test-the-experience")).toBe("chapter18");
  });

  it("parses the approved manuscript with Make It Falsifiable, six subheadings, and five references", () => {
    const chapter = loadGuidebookChapter18();
    expect(chapter.title).toBe(CHAPTER_18_TITLE);
    expect(chapter.references).toHaveLength(5);
    const practice = chapter.blocks.filter((block) => block.kind === "practice");
    expect(practice).toHaveLength(1);
    const parts = practice[0]?.kind === "practice" ? practice[0].parts : [];
    expect(parts.map((part) => part.label)).toEqual(["Summary", "Experiment", "Intention"]);
    const experiment = parts.find((part) => part.label === "Experiment");
    const subheads = experiment?.blocks.filter((block) => block.kind === "subheading") ?? [];
    expect(subheads.map((block) => (block.kind === "subheading" ? block.text : ""))).toEqual([
      "Make It Falsifiable",
      "Write the rule first",
      "Hide the answer",
      "Record before checking",
      "Reveal",
      "Keep the denominator",
      "Repeat",
    ]);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "Summary")).toBe(false);
    expect(chapter.blocks.some((block) => block.kind === "attention")).toBe(false);
    expect(JSON.stringify(chapter)).not.toMatch(/\bPEx\b/);
    expect(JSON.stringify(chapter)).toContain("AWARE proved consciousness leaves the body");
    expect(JSON.stringify(chapter)).toContain("AWARE disproved every OBE claim");
    expect(JSON.stringify(chapter)).toContain("Not:");
  });
});
