import { DAY_COUNT, type DayProgress } from "../domain/types.ts";

export function placeholderDayCopy(day: number): { title: string; body: string } {
  return {
    title: `Day ${day} — DEVELOPMENT FIXTURE`,
    body: "DEVELOPMENT FIXTURE — not canonical curriculum. Placeholder identifier only. Canonical lesson content is transported by PEx Primary and is not invented here.",
  };
}

export function allDaysUnlocked(rows: DayProgress[]): boolean {
  if (rows.length !== DAY_COUNT) return false;
  return rows.every((row, index) => row.day === index + 1 && row.unlocked === true);
}
