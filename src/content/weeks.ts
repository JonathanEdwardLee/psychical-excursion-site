import { DAY_COUNT } from "../domain/types.ts";

/** Calendar-style weeks for participant-facing navigation (7-day blocks). */
export function weekCount(): number {
  return Math.ceil(DAY_COUNT / 7);
}

export function weekForDay(day: number): number {
  if (!Number.isInteger(day) || day < 1) return 1;
  return Math.min(Math.ceil(day / 7), weekCount());
}

export function weekLabel(week: number): string {
  return `Week ${week}`;
}

export function weekLabelForDay(day: number): string {
  return weekLabel(weekForDay(day));
}

export function daysInWeek(week: number): number[] {
  const start = (week - 1) * 7 + 1;
  const end = Math.min(week * 7, DAY_COUNT);
  const days: number[] = [];
  for (let day = start; day <= end; day += 1) days.push(day);
  return days;
}

export function allWeekNumbers(): number[] {
  const count = weekCount();
  return Array.from({ length: count }, (_, index) => index + 1);
}

export function weekDayRange(week: number): { start: number; end: number } {
  const days = daysInWeek(week);
  return { start: days[0]!, end: days[days.length - 1]! };
}

export function positionInWeek(day: number): { week: number; index: number; length: number } {
  const week = weekForDay(day);
  const { start, end } = weekDayRange(week);
  return { week, index: day - start + 1, length: end - start + 1 };
}
