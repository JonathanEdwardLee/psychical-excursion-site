import { loadCurriculumPacket } from "../../content/load.ts";
import { PHASES, phaseById, daysInPhase } from "../../content/phases.ts";
import { localStore } from "../../db/store.ts";
import type { DayProgress } from "../../domain/types.ts";
import { dayHref } from "../../progress/progress.ts";
import { statusBox } from "../bits.ts";
import { el, text } from "../dom.ts";
import { phaseNav } from "../shell.ts";

export async function renderDaysPage(main: HTMLElement): Promise<void> {
  const rows = await localStore.listProgress();
  const byDay = new Map(rows.map((row) => [row.day, row]));
  const packet = loadCurriculumPacket();
  const groups = el("div", { class: "phase-groups" });
  for (const phase of PHASES) {
    const list = el("ol", { class: "day-list", start: String(phase.start) });
    for (const day of daysInPhase(phase)) {
      list.append(dayItem(day, byDay.get(day), packet.days.find((item) => item.day === day)?.title));
    }
    groups.append(
      el("section", { class: "phase-block" }, [
        el("h3", {}, [
          el("a", { href: `#/phase/${phase.id}` }, [`${phase.name}`]),
          text(` · Days ${phase.start}–${phase.end}`),
        ]),
        list,
      ]),
    );
  }
  main.append(
    el("article", { class: "surface" }, [
      el("h2", {}, ["Days 1–60"]),
      el("p", { class: "lede" }, [
        "All days stay unlocked. There are no streaks and no penalties. Completion is explicit and can be undone.",
      ]),
      phaseNav(),
      groups,
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
  const list = el("ol", { class: "day-list", start: String(phase.start) });
  for (const day of daysInPhase(phase)) {
    list.append(dayItem(day, byDay.get(day), packet.days.find((item) => item.day === day)?.title));
  }
  const prev = PHASES[PHASES.findIndex((item) => item.id === phase.id) - 1];
  const next = PHASES[PHASES.findIndex((item) => item.id === phase.id) + 1];
  main.append(
    el("article", { class: "surface" }, [
      el("p", { class: "eyebrow" }, [`Phase ${PHASES.findIndex((item) => item.id === phase.id) + 1} of 8`]),
      el("h2", {}, [phase.name]),
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
  return el("li", {}, [
    el("a", { href: dayHref(day) }, [
      title && !title.includes("DEVELOPMENT FIXTURE") ? title : `Day ${day}`,
      text(` · ${label}`),
    ]),
  ]);
}
