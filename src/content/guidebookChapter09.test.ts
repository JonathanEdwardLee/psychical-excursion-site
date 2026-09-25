import { describe, expect, it } from "vitest";
import {
  CHAPTER_09_HASH,
  CHAPTER_09_PATH,
  CHAPTER_09_TITLE,
  loadGuidebookChapter09,
} from "./guidebookChapter09.ts";
import { parseGuidebookPublicPage } from "../ui/guidebookRoute.ts";
import { RELAX_THE_BODY_HREF } from "./guidebookAnchors.ts";

describe("Chapter 9 Watch the Edge manuscript", () => {
  it("locks title and public hash", () => {
    expect(CHAPTER_09_TITLE).toBe("Watch the Edge: Hypnagogia and the Transition Into Lucid Dreaming");
    expect(CHAPTER_09_PATH).toBe("/hypnagogia-lucid-dreaming/");
    expect(CHAPTER_09_HASH).toBe("/hypnagogia-lucid-dreaming/");
    expect(parseGuidebookPublicPage(CHAPTER_09_HASH)).toBe("chapter09");
  });

  it("parses the approved manuscript with one practice component, fourteen references, and the Relax the body href", () => {
    const chapter = loadGuidebookChapter09();
    expect(chapter.title).toBe(CHAPTER_09_TITLE);
    expect(chapter.references).toHaveLength(14);
    const practice = chapter.blocks.filter((block) => block.kind === "practice");
    expect(practice).toHaveLength(1);
    const parts = practice[0]?.kind === "practice" ? practice[0].parts : [];
    expect(parts.map((part) => part.label)).toEqual(["Summary", "Experiment", "Intention"]);
    const experiment = parts.find((part) => part.label === "Experiment");
    expect(JSON.stringify(experiment)).toContain(`[**Relax the body**](${RELAX_THE_BODY_HREF})`);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "Summary")).toBe(false);
    expect(chapter.blocks.some((block) => block.kind === "attention")).toBe(false);
    expect(JSON.stringify(chapter)).not.toMatch(/\bPEx\b/);
  });
});
