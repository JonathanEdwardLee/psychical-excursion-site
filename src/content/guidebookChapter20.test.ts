import { describe, expect, it } from "vitest";
import {
  CHAPTER_20_HASH,
  CHAPTER_20_PATH,
  CHAPTER_20_TITLE,
  loadGuidebookChapter20,
} from "./guidebookChapter20.ts";
import { parseGuidebookPublicPage } from "../ui/guidebookRoute.ts";

describe("Chapter 20 Watch the Sky manuscript", () => {
  it("locks title and public hash", () => {
    expect(CHAPTER_20_TITLE).toBe(
      "Watch the Sky: Sun, Moon, Planets and the Science of Sleep & Dreams",
    );
    expect(CHAPTER_20_PATH).toBe("/sun-moon-planets-sleep-dreams/");
    expect(CHAPTER_20_HASH).toBe("/sun-moon-planets-sleep-dreams/");
    expect(parseGuidebookPublicPage(CHAPTER_20_HASH)).toBe("chapter20");
    expect(parseGuidebookPublicPage("#/watch-the-sky")).toBe("chapter20");
  });

  it("parses the approved manuscript with Track the Sky Without Cheating, six subheadings, and thirteen references", () => {
    const chapter = loadGuidebookChapter20();
    expect(chapter.title).toBe(CHAPTER_20_TITLE);
    expect(chapter.references).toHaveLength(13);
    const practice = chapter.blocks.filter((block) => block.kind === "practice");
    expect(practice).toHaveLength(1);
    const parts = practice[0]?.kind === "practice" ? practice[0].parts : [];
    expect(parts.map((part) => part.label)).toEqual(["Summary", "Experiment", "Intention"]);
    const experiment = parts.find((part) => part.label === "Experiment");
    const subheads = experiment?.blocks.filter((block) => block.kind === "subheading") ?? [];
    expect(subheads.map((block) => (block.kind === "subheading" ? block.text : ""))).toEqual([
      "Track the Sky Without Cheating",
      "Record the night first",
      "Add the Sun",
      "Add the Moon",
      "Add solar or geomagnetic conditions only later",
      "Add one planetary claim",
      "Compare",
    ]);
    expect(chapter.blocks.some((block) => block.kind === "subheading" && block.text === "Moonlight")).toBe(true);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "Summary")).toBe(false);
    expect(chapter.blocks.some((block) => block.kind === "attention")).toBe(false);
    expect(JSON.stringify(chapter)).not.toMatch(/\bPEx\b/);
    expect(JSON.stringify(chapter)).not.toMatch(/astrology is scientifically validated/i);
    expect(JSON.stringify(chapter)).not.toMatch(/lunar sleep effects are settled/i);
  });
});
