import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "../..");
const PUBLICATION_BASELINE = "c969ebb5650e4f854b3d1a1284458a818eb71cfb";

describe("Publication Master", () => {
  it("snapshots 23 chapters from the accepted web baseline without URLs in narrative", () => {
    const manifest = JSON.parse(readFileSync(join(ROOT, "publication/manifest.json"), "utf8"));
    expect(manifest.web_edition_baseline).toBe(PUBLICATION_BASELINE);
    expect(manifest.chapter_count).toBe(23);
    const chapterFiles = readdirSync(join(ROOT, "publication/chapters")).filter((name) => name.endsWith(".md"));
    expect(chapterFiles).toHaveLength(23);

    const finalChapter = readFileSync(
      join(ROOT, "publication/chapters/23-return-record-repeat.md"),
      "utf8",
    );
    expect(finalChapter).toContain("My body sleeps. I remain aware. I recognize the transition and calmly enter.");
    expect(finalChapter).toContain("I stay with the experience and explore before I explain.");
    expect(finalChapter).toContain("Next time I am dreaming, I remember that I am dreaming.");

    for (const file of chapterFiles) {
      const text = readFileSync(join(ROOT, "publication/chapters", file), "utf8");
      const narrative = text.split("\n## References\n")[0] ?? text;
      expect(narrative).not.toMatch(/\]\(\//);
      expect(narrative).not.toMatch(/pex:attention-instrument/);
      expect(narrative).not.toMatch(/#\/[a-z]/);
    }
  });
});
