import { describe, expect, it } from "vitest";
import {
  CHAPTER_07_HASH,
  CHAPTER_07_PATH,
  CHAPTER_07_TITLE,
  loadGuidebookChapter07,
} from "./guidebookChapter07.ts";
import { parseGuidebookPublicPage } from "../ui/guidebookRoute.ts";
import { RELAX_THE_BODY_HREF } from "./guidebookAnchors.ts";

describe("Chapter 7 Quiet the Mind manuscript", () => {
  it("locks title and public hash", () => {
    expect(CHAPTER_07_TITLE).toBe("Quiet the Mind: Meditation Techniques for Sleep and Dream Awareness");
    expect(CHAPTER_07_PATH).toBe("/meditation-for-lucid-dreaming/");
    expect(CHAPTER_07_HASH).toBe("/meditation-for-lucid-dreaming/");
    expect(parseGuidebookPublicPage(CHAPTER_07_HASH)).toBe("chapter07");
  });

  it("parses the approved manuscript with one practice component and six references", () => {
    const chapter = loadGuidebookChapter07();
    expect(chapter.title).toBe(CHAPTER_07_TITLE);
    expect(chapter.references).toHaveLength(6);
    const practice = chapter.blocks.filter((block) => block.kind === "practice");
    expect(practice).toHaveLength(1);
    const parts = practice[0]?.kind === "practice" ? practice[0].parts : [];
    expect(parts.map((part) => part.label)).toEqual(["Summary", "Experiment", "Intention"]);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "Summary")).toBe(false);
    expect(chapter.blocks.some((block) => block.kind === "attention")).toBe(false);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "Focused Attention and Open Monitoring")).toBe(true);
    const experiment = parts.find((part) => part.label === "Experiment");
    const experimentText = JSON.stringify(experiment);
    expect(experimentText).toContain(`[**Relax the body**](${RELAX_THE_BODY_HREF})`);
    expect(JSON.stringify(chapter)).not.toMatch(/\bPEx\b/);
  });
});
