import { phaseForDay } from "../content/phases.ts";
import { weekLabelForDay } from "../content/weeks.ts";
import { localStore } from "../db/store.ts";
import { resumeDay } from "../progress/progress.ts";

export type CapturePracticeContext = {
  day: number;
  phaseId: string | null;
  weekLabel: string;
};

export async function loadCapturePracticeContext(): Promise<CapturePracticeContext> {
  const rows = await localStore.listProgress();
  const day = resumeDay(rows, await localStore.loadResumeDay());
  const phase = phaseForDay(day);
  return {
    day,
    phaseId: phase?.id ?? null,
    weekLabel: weekLabelForDay(day),
  };
}
