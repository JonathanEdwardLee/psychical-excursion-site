import { describe, expect, it } from "vitest";
import { daysInWeek, weekForDay, weekLabel, weekLabelForDay } from "./weeks.ts";

describe("week navigation labels", () => {
  it("maps days to chronological weeks", () => {
    expect(weekForDay(1)).toBe(1);
    expect(weekForDay(7)).toBe(1);
    expect(weekForDay(8)).toBe(2);
    expect(weekForDay(60)).toBe(9);
    expect(weekLabelForDay(1)).toBe("Week 1");
    expect(weekLabel(2)).toBe("Week 2");
  });

  it("covers all sixty days across weeks", () => {
    const seen = new Set<number>();
    for (let week = 1; week <= 9; week += 1) {
      for (const day of daysInWeek(week)) seen.add(day);
    }
    expect(seen.size).toBe(60);
  });
});
