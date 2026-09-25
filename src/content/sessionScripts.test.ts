import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const AUDIO_PRODUCTION_BASELINE = "c08aa9c5265af96d7c7f8b38a1cd11a38653e858";
const PILOT_MENU = 10;

const ROOT = join(import.meta.dirname, "../..");
const SCRIPTS = join(ROOT, "publication/audio/session-scripts");
const CHAPTERS = join(ROOT, "publication/chapters");

function spokenOnly(script: string): string {
  return script.replace(/<!--[\s\S]*?-->/g, " ");
}

function countWords(text: string): number {
  return spokenOnly(text).trim().split(/\s+/).filter(Boolean).length;
}

const PROTECTED = [
  "My body sleeps. I remain aware. I recognize the transition and calmly enter.",
  "I stay with the experience and explore before I explain.",
  "Next time I am dreaming, I remember that I am dreaming.",
];

describe("audiobook session scripts", () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, "publication/audio/TRACK-MANIFEST.json"), "utf8"));
  const chapterScripts = readdirSync(SCRIPTS)
    .filter((name) => /^\d{2}-.+\.md$/.test(name) && !name.startsWith("00") && !name.startsWith("24") && !name.startsWith("25") && !name.startsWith("99"));

  it("maps 23 generated chapter scripts to publication chapters", () => {
    expect(manifest.publication_master_baseline).toBe(AUDIO_PRODUCTION_BASELINE);
    expect(manifest.recommended_pilot_menu).toBe(Number(PILOT_MENU));
    const chapterTracks = manifest.tracks.filter((t: { kind: string }) => t.kind === "chapter");
    expect(chapterTracks).toHaveLength(23);
    const files = readdirSync(CHAPTERS).filter((name) => name.endsWith(".md"));
    expect(files).toHaveLength(23);
    for (const file of files) {
      expect(readFileSync(join(SCRIPTS, file), "utf8").length).toBeGreaterThan(100);
    }
    expect(chapterScripts).toHaveLength(23);
  });

  it("keeps protected lines and drops citations, references, and raw identifiers", () => {
    const closingChapter = readFileSync(join(SCRIPTS, "23-return-record-repeat.md"), "utf8");
    for (const line of PROTECTED) {
      expect(closingChapter).toContain(line);
    }
    const intro = readFileSync(join(SCRIPTS, "01-what-is-a-psychical-excursion.md"), "utf8");
    const remember = readFileSync(join(SCRIPTS, "02-remember-your-dreams.md"), "utf8");
    expect(intro).not.toMatch(/\[\d+\]/);
    expect(remember).not.toMatch(/\[\d+\]/);
    expect(intro).not.toMatch(/\n## References\n/);
    expect(intro.toLowerCase()).not.toContain("doi:");
    expect(intro).not.toMatch(/https?:\/\//);
    expect(intro).not.toMatch(/\bPMID\b/);
    expect(spokenOnly(intro)).not.toMatch(/^---$/m);
  });

  it("reconciles chapter script words with publication narration counts", () => {
    const pub = JSON.parse(readFileSync(join(ROOT, "publication/manifest.json"), "utf8"));
    expect(manifest.totals.publication_narration_words).toBe(pub.narration_words_excluding_references);
    const chapterTracks = manifest.tracks.filter((t: { kind: string }) => t.kind === "chapter");
    for (const track of chapterTracks) {
      const menu = String(track.chapter_number).padStart(2, "0");
      const pubChapter = pub.chapters.find((c: { menu: string }) => c.menu === menu);
      expect(pubChapter).toBeTruthy();
      const script = readFileSync(join(ROOT, "publication", track.session_script), "utf8");
      expect(countWords(script)).toBe(track.narration_word_count);
      const spoken = spokenOnly(script);
      expect(spoken).not.toContain("<!--");
      const extra = track.narration_word_count - pubChapter.narration_words_excluding_references;
      // Heading hashes and thematic breaks are not spoken; "Chapter N" is added.
      expect(Math.abs(extra)).toBeLessThan(80);
    }
  });

  it("does not invent publisher facts in credits", () => {
    const opening = readFileSync(join(SCRIPTS, "00-opening-credits.md"), "utf8");
    const closing = readFileSync(join(SCRIPTS, "99-closing-credits.md"), "utf8");
    expect(opening).toContain("Jonathan Lee");
    expect(opening).toContain("psychicalexcursion.com");
    expect(opening).not.toMatch(/https?:\/\//);
    expect(closing).toContain("No publisher, ISBN, or publication date");
  });
});
