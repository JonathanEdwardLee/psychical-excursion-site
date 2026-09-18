import { DAY_COUNT, type DayProgress } from "../domain/types.ts";

export function placeholderDayCopy(day: number): { title: string; body: string } {
  return {
    title: `Day ${day}`,
    body: "Placeholder identifier only. Canonical lesson content is not included in this engineering build and will arrive through a later Primary-reviewed transport. This screen exists to prove local progress storage and navigation.",
  };
}

export function allDaysUnlocked(rows: DayProgress[]): boolean {
  if (rows.length !== DAY_COUNT) return false;
  return rows.every((row, index) => row.day === index + 1 && row.unlocked === true);
}
