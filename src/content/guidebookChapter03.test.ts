import { describe, expect, it } from "vitest";
import {
  CHAPTER_03_HASH,
  CHAPTER_03_PATH,
  CHAPTER_03_PLACEHOLDER_MARKER,
  CHAPTER_03_TITLE,
  isGuidebookChapter03Ready,
  loadGuidebookChapter03,
} from "./guidebookChapter03.ts";
import { parseGuidebookPublicPage } from "../ui/guidebookRoute.ts";

describe("Chapter 3 Recognize plumbing", () => {
  it("locks title and public hash without exposing a manuscript yet", () => {
    expect(CHAPTER_03_TITLE).toBe("You Are Dreaming. Recognize.");
    expect(CHAPTER_03_PATH).toBe("/you-are-dreaming-recognize");
    expect(CHAPTER_03_HASH).toBe("#/you-are-dreaming-recognize");
    expect(isGuidebookChapter03Ready()).toBe(false);
    expect(() => loadGuidebookChapter03()).toThrow(/not been supplied/i);
  });

  it("does not treat the placeholder source as an approved public page", () => {
    expect(parseGuidebookPublicPage(CHAPTER_03_HASH)).toBe("home");
    expect(CHAPTER_03_PLACEHOLDER_MARKER).toBe("PEX-IMPLEMENTATION-PLACEHOLDER");
  });
});
