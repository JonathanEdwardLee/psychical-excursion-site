import { describe, expect, it } from "vitest";
import {
  CHAPTER_04_HASH,
  CHAPTER_04_PATH,
  CHAPTER_04_TITLE,
  loadGuidebookChapter04,
} from "./guidebookChapter04.ts";
import { parseGuidebookPublicPage } from "../ui/guidebookRoute.ts";

describe("Chapter 4 Feel the Body manuscript", () => {
  it("locks title and public hash", () => {
    expect(CHAPTER_04_TITLE).toBe("Feel the Body: Body Scan Meditation and Deep Relaxation");
    expect(CHAPTER_04_PATH).toBe("/body-scan-meditation/");
    expect(CHAPTER_04_HASH).toBe("/body-scan-meditation/");
    expect(parseGuidebookPublicPage(CHAPTER_04_HASH)).toBe("chapter04");
  });

  it("parses the approved manuscript with one practice component and three references", () => {
    const chapter = loadGuidebookChapter04();
    expect(chapter.title).toBe(CHAPTER_04_TITLE);
    expect(chapter.references).toHaveLength(4);
    const practice = chapter.blocks.filter((block) => block.kind === "practice");
    expect(practice).toHaveLength(1);
    const parts = practice[0]?.kind === "practice" ? practice[0].parts : [];
    expect(parts.map((part) => part.label)).toEqual(["Summary", "Experiment", "Intention"]);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "Summary")).toBe(false);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "Progressive Muscle Relaxation")).toBe(false);
    expect(chapter.blocks.some((block) => block.kind === "heading" && block.text === "A Nighttime Body Release")).toBe(true);
  });
});
