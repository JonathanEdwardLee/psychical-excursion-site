import { describe, expect, it } from "vitest";
import { allDaysUnlocked } from "./days.ts";
import { completedCount, firstIncompleteDay, previousDay, nextDay, resumeDay } from "./progress.ts";
import { DAY_COUNT, emptyDayProgress } from "../domain/types.ts";

describe("progress behavior", () => {
  const rows = Array.from({ length: DAY_COUNT }, (_, i) => emptyDayProgress(i + 1));

  it("keeps sixty days unlocked with no streak field", () => {
    expect(allDaysUnlocked(rows)).toBe(true);
    expect(rows.every((row) => row.unlocked === true)).toBe(true);
    expect(rows.every((row) => !("streak" in row))).toBe(true);
  });

  it("does not treat visit as completion", () => {
    const visited = rows.map((row) => (row.day === 3 ? { ...row, visitedAt: 1 } : row));
    expect(completedCount(visited)).toBe(0);
    expect(firstIncompleteDay(visited)).toBe(1);
  });

  it("resumes the stored incomplete day, else the first incomplete", () => {
    const someComplete = rows.map((row) =>
      row.day <= 4 ? { ...row, completedAt: 10 } : row,
    );
    expect(resumeDay(someComplete, 4)).toBe(5);
    expect(resumeDay(someComplete, 8)).toBe(8);
    expect(previousDay(1)).toBeNull();
    expect(nextDay(60)).toBeNull();
    expect(previousDay(10)).toBe(9);
    expect(nextDay(10)).toBe(11);
  });
});
