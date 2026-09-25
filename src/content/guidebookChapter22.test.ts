import { describe, expect, it } from "vitest";
import {
  CHAPTER_22_HASH,
  CHAPTER_22_PATH,
  CHAPTER_22_TITLE,
  loadGuidebookChapter22,
} from "./guidebookChapter22.ts";
import { parseGuidebookPublicPage } from "../ui/guidebookRoute.ts";

const AFFIRMATION = "My body sleeps. I remain aware. I recognize the transition and calmly enter.";
const INSIDE_STATE = "I stay with the experience and explore before I explain.";

describe("Chapter 22 Return Record Repeat manuscript", () => {
  it("locks title and public hash", () => {
    expect(CHAPTER_22_TITLE).toBe(
      "Return. Record. Repeat: The Best Bedtime Routine for Lucid Dreaming and Astral Projection",
    );
    expect(CHAPTER_22_PATH).toBe("/lucid-dreaming-astral-projection-bedtime-routine/");
    expect(CHAPTER_22_HASH).toBe("/lucid-dreaming-astral-projection-bedtime-routine/");
    expect(parseGuidebookPublicPage(CHAPTER_22_HASH)).toBe("chapter22");
    expect(parseGuidebookPublicPage("#/return-record-repeat")).toBe("chapter22");
  });

  it("parses the approved manuscript with The Thirty-Night Practice, six references, and exact wording", () => {
    const chapter = loadGuidebookChapter22();
    expect(chapter.title).toBe(CHAPTER_22_TITLE);
    expect(chapter.references).toHaveLength(6);
    const practice = chapter.blocks.filter((block) => block.kind === "practice");
    expect(practice).toHaveLength(1);
    const parts = practice[0]?.kind === "practice" ? practice[0].parts : [];
    expect(parts.map((part) => part.label)).toEqual(["Summary", "Experiment", "Intention"]);
    const experiment = parts.find((part) => part.label === "Experiment");
    const subheads = experiment?.blocks.filter((block) => block.kind === "subheading") ?? [];
    expect(subheads.map((block) => (block.kind === "subheading" ? block.text : ""))).toEqual([
      "The Thirty-Night Practice",
      "Keep the core stable",
      "Record five outcomes",
      "Use WBTB selectively",
      "Keep one affirmation",
      "Keep one inside-state instruction",
      "Review weekly",
      "End honestly",
    ]);
    const bodySubheads = chapter.blocks
      .filter((block) => block.kind === "subheading")
      .map((block) => (block.kind === "subheading" ? block.text : ""));
    expect(bodySubheads).toEqual([
      "Morning",
      "Day",
      "Before bed",
      "In bed",
      "At the threshold",
      "Inside",
      "On return",
    ]);
    expect(JSON.stringify(chapter)).toMatch(AFFIRMATION);
    expect(JSON.stringify(chapter)).toMatch(INSIDE_STATE);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "Summary")).toBe(false);
    expect(chapter.blocks.some((block) => block.kind === "attention")).toBe(false);
    expect(JSON.stringify(chapter)).not.toMatch(/\bPEx\b/);
    expect(JSON.stringify(chapter)).not.toMatch(/sleep paralysis is required/i);
  });
});
