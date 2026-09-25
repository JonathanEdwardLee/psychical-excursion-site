import { describe, expect, it } from "vitest";
import {
  CHAPTER_10_HASH,
  CHAPTER_10_PATH,
  CHAPTER_10_TITLE,
  loadGuidebookChapter10,
} from "./guidebookChapter10.ts";
import { parseGuidebookPublicPage } from "../ui/guidebookRoute.ts";
import { RELAX_THE_BODY_HREF } from "./guidebookAnchors.ts";

describe("Chapter 10 Let the Body Sleep manuscript", () => {
  it("locks title and public hash", () => {
    expect(CHAPTER_10_TITLE).toBe("Let the Body Sleep: The “Mind Awake, Body Asleep” Route to Lucid Dreaming");
    expect(CHAPTER_10_PATH).toBe("/mind-awake-body-asleep/");
    expect(CHAPTER_10_HASH).toBe("/mind-awake-body-asleep/");
    expect(parseGuidebookPublicPage(CHAPTER_10_HASH)).toBe("chapter10");
  });

  it("parses the approved manuscript with one practice component, thirteen references, and the Relax the body href", () => {
    const chapter = loadGuidebookChapter10();
    expect(chapter.title).toBe(CHAPTER_10_TITLE);
    expect(chapter.references).toHaveLength(13);
    const practice = chapter.blocks.filter((block) => block.kind === "practice");
    expect(practice).toHaveLength(1);
    const parts = practice[0]?.kind === "practice" ? practice[0].parts : [];
    expect(parts.map((part) => part.label)).toEqual(["Summary", "Experiment", "Intention"]);
    const experiment = parts.find((part) => part.label === "Experiment");
    expect(JSON.stringify(experiment)).toContain("[**Relax the body**](#/feel-the-body#nighttime-body-release)");
    expect(RELAX_THE_BODY_HREF).toBe("/body-scan-meditation/#nighttime-body-release");
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "Summary")).toBe(false);
    expect(chapter.blocks.some((block) => block.kind === "attention")).toBe(false);
    expect(JSON.stringify(chapter)).not.toMatch(/\bPEx\b/);
  });
});
