import { loadCurriculumPacket } from "../../content/load.ts";
import { PHASES, phaseById, daysInPhase } from "../../content/phases.ts";
import { localStore } from "../../db/store.ts";
import type { DayProgress } from "../../domain/types.ts";
import { completedCount, dayHref } from "../../progress/progress.ts";
import { statusBox } from "../bits.ts";
import { el, text } from "../dom.ts";
import { PHASE_INDEX_MARKS, padDay } from "../motif.ts";
import { phaseNav } from "../shell.ts";

export async function renderDaysPage(main: HTMLElement): Promise<void> {
  const rows = await localStore.listProgress();
  const byDay = new Map(rows.map((row) => [row.day, row]));
  const packet = loadCurriculumPacket();
  const done = completedCount(rows);
  const journey = el("div", { class: "journey", "aria-label": "Sixty-day journey" });
  PHASES.forEach((phase, index) => {
    const days = daysInPhase(phase);
    const complete = days.filter((day) => byDay.get(day)?.completedAt).length;
    const list = el("ol", { class: "day-rail", start: String(phase.start) });
    for (const day of days) {
      list.append(dayItem(day, byDay.get(day), packet.days.find((item) => item.day === day)?.title));
    }
    journey.append(
      el("section", { class: "phase-chapter", id: `phase-${phase.id}` }, [
        el("header", { class: "phase-head" }, [
          el("p", { class: "phase-index" }, [PHASE_INDEX_MARKS[index] ?? ""]),
          el("h3", {}, [el("a", { href: `#/phase/${phase.id}` }, [phase.name])]),
          el("p", { class: "phase-range" }, [`Days ${padDay(phase.start)}–${padDay(phase.end)}`]),
          el("p", { class: "phase-count meta" }, [`${complete} of ${days.length} complete`]),
        ]),
        list,
      ]),
    );
  });
  main.append(
    el("article", { class: "days-surface" }, [
      el("header", { class: "days-intro" }, [
        el("p", { class: "eyebrow" }, ["Eight phases"]),
        el("h2", { class: "display-title" }, ["Days 1–60"]),
        el("p", { class: "lede" }, [
          "All days stay unlocked. There are no streaks and no penalties. Completion is explicit and can be undone.",
        ]),
        el("p", { class: "meta" }, [`${done} of 60 marked complete on this device.`]),
        phaseNav(),
      ]),
      journey,
    ]),
  );
}

export async function renderPhasePage(main: HTMLElement, phaseId: string): Promise<void> {
  const phase = phaseById(phaseId);
  if (!phase) {
    main.append(el("h2", {}, ["Phase"]), statusBox("error", "Unknown phase", "Choose a phase from the day list."));
    return;
  }
  const rows = await localStore.listProgress();
  const byDay = new Map(rows.map((row) => [row.day, row]));
  const packet = loadCurriculumPacket();
  const index = PHASES.findIndex((item) => item.id === phase.id);
  const list = el("ol", { class: "day-rail", start: String(phase.start) });
  for (const day of daysInPhase(phase)) {
    list.append(dayItem(day, byDay.get(day), packet.days.find((item) => item.day === day)?.title));
  }
  const prev = PHASES[index - 1];
  const next = PHASES[index + 1];
  main.append(
    el("article", { class: "days-surface phase-surface" }, [
      el("p", { class: "eyebrow" }, [`Phase ${PHASE_INDEX_MARKS[index]} of VIII`]),
      el("h2", { class: "display-title" }, [phase.name]),
      el("p", { class: "lede" }, [`Days ${phase.start}–${phase.end}. All unlocked. Structural navigation only.`]),
      phaseNav(phase.id),
      list,
      el("p", { class: "actions" }, [
        prev ? el("a", { href: `#/phase/${prev.id}` }, [`Previous: ${prev.name}`]) : text(""),
        next ? el("a", { href: `#/phase/${next.id}` }, [`Next: ${next.name}`]) : text(""),
      ]),
    ]),
  );
}

function dayItem(day: number, row: DayProgress | undefined, title?: string): HTMLLIElement {
  const state = row?.completedAt ? "complete" : row?.visitedAt ? "opened" : "available";
  const label = state === "complete" ? "complete" : state === "opened" ? "opened" : "available";
  return el("li", { class: `day-row is-${state}` }, [
    el("a", { href: dayHref(day), class: "day-row-link" }, [
      el("span", { class: "day-node", "aria-hidden": "true" }),
      el("span", { class: "day-num" }, [padDay(day)]),
      el("span", { class: "day-title" }, [title ? title : `Day ${day}`]),
      el("span", { class: "day-state" }, [label]),
    ]),
  ]);
}
