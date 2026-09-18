import { describe, expect, it } from "vitest";
import { allDaysUnlocked, placeholderDayCopy } from "./days.ts";
import { DAY_COUNT } from "../domain/types.ts";

describe("progress placeholders", () => {
  it("does not invent curriculum copy", () => {
    const copy = placeholderDayCopy(3);
    expect(copy.body).toMatch(/not included/i);
    expect(copy.body.toLowerCase()).not.toMatch(/breathe in for four/);
  });

  it("requires sixty unlocked days in order", () => {
    const rows = Array.from({ length: DAY_COUNT }, (_, i) => ({
      day: i + 1,
      unlocked: true as const,
      visitedAt: null,
    }));
    expect(allDaysUnlocked(rows)).toBe(true);
  });
});
