import { describe, expect, it } from "vitest";
import { allDaysUnlocked } from "./days.ts";
import { DAY_COUNT } from "../domain/types.ts";

describe("progress placeholders", () => {
  it("requires sixty unlocked days in order", () => {
    const rows = Array.from({ length: DAY_COUNT }, (_, i) => ({
      day: i + 1,
      unlocked: true as const,
      visitedAt: null,
      completedAt: null,
    }));
    expect(allDaysUnlocked(rows)).toBe(true);
  });
});
