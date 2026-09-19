import { describe, expect, it } from "vitest";
import { CANONICAL_PACKET } from "./canonical.ts";
import { isOldModuleTitle, participantViewFor, PLAIN_TITLES } from "./participantLayer.ts";

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
