export const PHASES = [
  { id: "remember", name: "REMEMBER", start: 1, end: 4 },
  { id: "feel", name: "FEEL", start: 5, end: 14 },
  { id: "hold", name: "HOLD", start: 15, end: 21 },
  { id: "recognize", name: "RECOGNIZE", start: 22, end: 30 },
  { id: "observe", name: "OBSERVE", start: 31, end: 38 },
  { id: "move", name: "MOVE", start: 39, end: 46 },
  { id: "attempt", name: "ATTEMPT", start: 47, end: 54 },
  { id: "learn-your-door", name: "LEARN YOUR DOOR", start: 55, end: 60 },
] as const;

export type PhaseId = (typeof PHASES)[number]["id"];
export type Phase = (typeof PHASES)[number];

export const OPTIONAL_TIMING_DAY = 51;

export function phaseForDay(day: number): Phase | null {
  return PHASES.find((phase) => day >= phase.start && day <= phase.end) ?? null;
}

export function phaseById(id: string): Phase | null {
  return PHASES.find((phase) => phase.id === id) ?? null;
}

export function daysInPhase(phase: Phase): number[] {
  const days: number[] = [];
  for (let day = phase.start; day <= phase.end; day += 1) days.push(day);
  return days;
}
