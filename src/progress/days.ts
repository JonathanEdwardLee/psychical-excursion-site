import { DAY_COUNT, type DayProgress } from "../domain/types.ts";

export function allDaysUnlocked(rows: DayProgress[]): boolean {
  if (rows.length !== DAY_COUNT) return false;
  return rows.every((row, index) => row.day === index + 1 && row.unlocked === true);
}
