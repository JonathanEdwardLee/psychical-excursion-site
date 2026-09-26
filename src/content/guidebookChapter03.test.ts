import { describe, expect, it } from "vitest";
import {
  CHAPTER_03_HASH,
  CHAPTER_03_PATH,
  CHAPTER_03_TITLE,
  loadGuidebookChapter03,
} from "./guidebookChapter03.ts";
import { parseGuidebookPublicPage } from "../ui/guidebookRoute.ts";
import { loadGuidebookChapter02 } from "./guidebookChapter02.ts";

function dump(value: unknown): string {
  return JSON.stringify(value);
}

describe("Chapter 3 Recognize manuscript", () => {
  it("locks title and public hash", () => {
    expect(CHAPTER_03_TITLE).toBe("Recognize the Dream: Lucid Dreaming, Reality Checks and Dream Signs");
    expect(CHAPTER_03_PATH).toBe("/lucid-dreaming-reality-checks/");
    expect(CHAPTER_03_HASH).toBe("/lucid-dreaming-reality-checks/");
    expect(parseGuidebookPublicPage(CHAPTER_03_HASH)).toBe("chapter03");
  });

  it("advances into MILD and recognition rehearsal without re-teaching Chapter 3 dream-sign lists", () => {
    const chapter = loadGuidebookChapter03();
    const chapter2 = loadGuidebookChapter02();
    expect(chapter.title).toBe(CHAPTER_03_TITLE);
    expect(chapter.references).toHaveLength(4);
    const practice = chapter.blocks.filter((block) => block.kind === "practice");
    expect(practice).toHaveLength(1);
    expect(practice[0]?.kind === "practice" ? practice[0].parts.map((part) => part.label) : []).toEqual([
      "Summary",
      "Experiment",
      "Intention",
    ]);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "Try This")).toBe(false);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "MILD")).toBe(true);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "Reality Checks Are Not the Skill")).toBe(
      true,
    );
    expect(dump(chapter)).toContain("prospective memory");
    expect(dump(chapter)).toContain("In the last chapter, we learned to notice the clues dreams give us");
    expect(dump(chapter)).not.toContain("DREAM MODE ENABLED");
    expect(dump(chapter)).not.toContain("your childhood home;");
    expect(dump(chapter2)).toContain("childhood home");
  });
});
