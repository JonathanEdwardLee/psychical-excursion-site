import { describe, expect, it } from "vitest";
import { CANONICAL_PACKET } from "./canonical.ts";
import { GUIDED_DO_THIS, guidedDoThisForDay } from "./participantDoThis.ts";
import { isOldModuleTitle, participantViewFor, PLAIN_TITLES } from "./participantLayer.ts";

/** Lines that are only a bare label token (not speakable guidance). */
const BARE_LABEL_LINE =
  /^(time|entry|anchor|SENSORY|OBSERVATION|LUCID|MILD|NATURAL AWAKENING|MINIMAL|MOTION|ONE ENTRY|ONE ACTION|or|and|relax|watch|listen|feel|roll|rise|float|sleep)$/i;

function isCompleteSpeakableParagraph(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const words = trimmed.split(/\s+/);
  if (words.length < 2) return /[.?]$/.test(trimmed);
  return /[.?]$/.test(trimmed);
}

describe("participant day layer", () => {
  it("covers all sixty days with plain titles and Do this copy", () => {
    expect(PLAIN_TITLES).toHaveLength(60);
    for (const document of CANONICAL_PACKET.days) {
      const view = participantViewFor(document);
      expect(view.displayTitle).toBeTruthy();
      expect(view.displayTitle).not.toBe(document.title);
      expect(isOldModuleTitle(view.displayTitle)).toBe(false);
      expect(view.doThis.length).toBeGreaterThan(0);
      expect(view.displayTitle).toEqual(PLAIN_TITLES[document.day - 1]);
    }
  });

  it("uses instruction-first titles on Day 1 and Day 60", () => {
    const day1 = participantViewFor(CANONICAL_PACKET.days[0]!);
    expect(day1.displayTitle).toMatch(/remember.*dream/i);
    expect(day1.displayTitle).not.toMatch(/CATCH THE DREAM/);
    const day60 = participantViewFor(CANONICAL_PACKET.days[59]!);
    expect(day60.displayTitle).toMatch(/simple attempt/i);
    expect(day60.displayTitle).not.toMatch(/INDEPENDENT ATTEMPT/);
    expect(day60.doThis.join(" ")).toMatch(/sleep/i);
  });
});

describe("guided Do this copy", () => {
  it("provides non-empty guided instruction for every day", () => {
    expect(GUIDED_DO_THIS).toHaveLength(60);
    for (let day = 1; day <= 60; day += 1) {
      const lines = guidedDoThisForDay(day);
      expect(lines.length, `day ${day}`).toBeGreaterThan(0);
      expect(participantViewFor(CANONICAL_PACKET.days[day - 1]!).doThis.length).toBe(lines.length);
    }
    expect(guidedDoThisForDay(0)).toEqual([]);
    expect(guidedDoThisForDay(61)).toEqual([]);
  });

  it("has no bare label-token lines", () => {
    for (let day = 1; day <= 60; day += 1) {
      for (const line of guidedDoThisForDay(day)) {
        expect(line.trim(), `day ${day}: ${line}`).not.toMatch(BARE_LABEL_LINE);
      }
    }
  });

  it("uses complete speakable sentences on list-heavy days 54, 59, and 60", () => {
    for (const day of [54, 59, 60]) {
      const lines = guidedDoThisForDay(day);
      expect(lines.some(isCompleteSpeakableParagraph), `day ${day}`).toBe(true);
      for (const line of lines) {
        expect(line.trim(), `day ${day}`).not.toMatch(BARE_LABEL_LINE);
      }
    }
  });

  it("Day 60 avoids comma-stitched bare option lists", () => {
    const text = guidedDoThisForDay(60).join(" ");
    expect(text).not.toMatch(/Choose your own:\s*time,/i);
    expect(text).toMatch(/when you will start/i);
  });

  it("Day 1 guided copy is full sentences without fragment lines", () => {
    const lines = guidedDoThisForDay(1);
    expect(lines.some(isCompleteSpeakableParagraph)).toBe(true);
    for (const line of lines) {
      expect(line.trim()).not.toMatch(BARE_LABEL_LINE);
      expect(line).not.toMatch(/^(an image|a place|a person)$/);
    }
  });
});
