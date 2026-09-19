import { loadCurriculumPacket } from "../content/load.ts";
import { positionInWeek, weekLabelForDay } from "../content/weeks.ts";
import { DAY_COUNT, type DayProgress } from "../domain/types.ts";

export { allDaysUnlocked } from "./days.ts";

export function isDayNumber(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= DAY_COUNT;
}

export function previousDay(day: number): number | null {
  return isDayNumber(day) && day > 1 ? day - 1 : null;
}

export function nextDay(day: number): number | null {
  return isDayNumber(day) && day < DAY_COUNT ? day + 1 : null;
}

export function completedCount(rows: DayProgress[]): number {
  return rows.filter((row) => row.completedAt !== null).length;
}

export function firstIncompleteDay(rows: DayProgress[]): number {
  const incomplete = rows.find((row) => row.completedAt === null);
  return incomplete?.day ?? DAY_COUNT;
}

export function resumeDay(rows: DayProgress[], storedResume: number | undefined): number {
  const stored = storedResume && isDayNumber(storedResume) ? storedResume : null;
  if (stored) {
    const row = rows.find((item) => item.day === stored);
    if (row && row.completedAt === null) return stored;
  }
  return firstIncompleteDay(rows);
}

export function weekPosition(day: number): { label: string; index: number; length: number; week: number } | null {
  if (!isDayNumber(day)) return null;
  const pos = positionInWeek(day);
  return {
    label: weekLabelForDay(day),
    week: pos.week,
    index: pos.index,
    length: pos.length,
  };
}

/** @deprecated Internal phase ranges only — use weekPosition in UI. */
export function phasePosition(day: number): { name: string; index: number; length: number } | null {
  const week = weekPosition(day);
  if (!week) return null;
  return { name: week.label, index: week.index, length: week.length };
}

export function neighboringDays(day: number): { previous: number | null; next: number | null } {
  return { previous: previousDay(day), next: nextDay(day) };
}

export function dayHref(day: number): string {
  return `#/day/${day}`;
}

export function documentForDay(day: number) {
  return loadCurriculumPacket().days.find((item) => item.day === day) ?? null;
}
