import { describe, expect, it } from "vitest";
import {
  CHAPTER_05_HASH,
  CHAPTER_05_PATH,
  CHAPTER_05_PLACEHOLDER_MARKER,
  CHAPTER_05_TITLE,
  isGuidebookChapter05Ready,
  loadGuidebookChapter05,
} from "./guidebookChapter05.ts";

describe("Chapter 5 plumbing", () => {
  it("is gated", () => {
    expect(CHAPTER_05_TITLE).toBe("Move Your Attention.");
    expect(CHAPTER_05_HASH).toBe("#/move-your-attention");
    expect(isGuidebookChapter05Ready()).toBe(false);
    expect(CHAPTER_05_PATH).toBe("/move-your-attention");
    expect(CHAPTER_05_PLACEHOLDER_MARKER).toBe("PEX-IMPLEMENTATION-PLACEHOLDER");
    expect(() => loadGuidebookChapter05()).toThrow(/not been supplied/i);
  });
});
