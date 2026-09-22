import { describe, expect, it } from "vitest";
import {
  CHAPTER_03_HASH,
  CHAPTER_03_PATH,
  CHAPTER_03_TITLE,
  isGuidebookChapter03Ready,
  loadGuidebookChapter03,
} from "./guidebookChapter03.ts";
import { parseGuidebookPublicPage } from "../ui/guidebookRoute.ts";

describe("Chapter 3 Recognize manuscript", () => {
  it("locks title and public hash and treats the approved manuscript as ready", () => {
    expect(CHAPTER_03_TITLE).toBe("You Are Dreaming. Recognize.");
    expect(CHAPTER_03_PATH).toBe("/you-are-dreaming-recognize");
    expect(CHAPTER_03_HASH).toBe("#/you-are-dreaming-recognize");
    expect(isGuidebookChapter03Ready()).toBe(true);
    expect(parseGuidebookPublicPage(CHAPTER_03_HASH)).toBe("chapter03");
  });

  it("parses the approved manuscript without rewriting voice or flattening the dream-sign list", () => {
    const chapter = loadGuidebookChapter03();
    expect(chapter.title).toBe(CHAPTER_03_TITLE);
    expect(chapter.references).toHaveLength(4);
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
    const steps = chapter.blocks.find((block) => block.kind === "list" && block.ordered);
    expect(steps?.kind === "list" ? steps.items : []).toHaveLength(5);
    expect(chapter.blocks.some((block) => block.kind === "quote" && block.text === "DREAM MODE ENABLED")).toBe(true);
  });
});
