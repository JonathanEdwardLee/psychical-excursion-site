import { describe, expect, it } from "vitest";
import { guidebookBookChapters } from "./guidebookBookChapters.ts";
import { INTRODUCTION_PATH } from "./guidebookCatalog.ts";
import { CHAPTER_22_PATH, CHAPTER_22_TITLE } from "./guidebookChapter22.ts";
import { CHAPTER_20_TITLE } from "./guidebookChapter20.ts";

describe("guidebook book chapter navigation list", () => {
  it("numbers the 23 book pages with the introduction as 01", () => {
    const chapters = guidebookBookChapters();
    expect(chapters).toHaveLength(23);
    expect(chapters[0]).toMatchObject({
      number: "01",
      title: "What Is a Psychical Excursion?",
      path: INTRODUCTION_PATH,
    });
    expect(chapters[20]?.title).toBe(CHAPTER_20_TITLE);
    expect(chapters[20]?.title).not.toMatch(/Watch the Sky/);
    expect(chapters[22]).toMatchObject({
      number: "23",
      title: CHAPTER_22_TITLE,
      path: CHAPTER_22_PATH,
    });
    expect(chapters.some((chapter) => chapter.path === "/")).toBe(false);
    expect(chapters.map((chapter) => chapter.number)).toEqual(
      Array.from({ length: 23 }, (_, index) => String(index + 1).padStart(2, "0")),
    );
  });
});
