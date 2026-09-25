import { describe, expect, it } from "vitest";
import {
  CHAPTER_03_HASH,
  CHAPTER_03_PATH,
  CHAPTER_03_TITLE,
  loadGuidebookChapter03,
} from "./guidebookChapter03.ts";
import { parseGuidebookPublicPage } from "../ui/guidebookRoute.ts";

describe("Chapter 3 Recognize manuscript", () => {
  it("locks title and public hash", () => {
    expect(CHAPTER_03_TITLE).toBe("Recognize the Dream: Lucid Dreaming, Reality Checks and Dream Signs");
    expect(CHAPTER_03_PATH).toBe("/lucid-dreaming-reality-checks/");
    expect(CHAPTER_03_HASH).toBe("/lucid-dreaming-reality-checks/");
    expect(parseGuidebookPublicPage(CHAPTER_03_HASH)).toBe("chapter03");
  });

  it("parses one practice component and keeps the dream-sign list", () => {
    const chapter = loadGuidebookChapter03();
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
    const bullets = chapter.blocks.find((block) => block.kind === "list" && !block.ordered);
    expect(bullets?.kind === "list" ? bullets.items : []).toEqual([
      "your childhood home;",
      "school;",
      "someone who has died;",
      "impossible architecture;",
      "malfunctioning phones;",
      "strange animals;",
      "floating;",
      "driving;",
      "being lost;",
      "missing an appointment;",
      "an unusual emotional state.",
    ]);
    expect(chapter.blocks.some((block) => block.kind === "quote" && block.text === "DREAM MODE ENABLED")).toBe(true);
  });
});
