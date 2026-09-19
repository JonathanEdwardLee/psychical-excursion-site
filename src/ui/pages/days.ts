import { loadCurriculumPacket } from "../../content/load.ts";
import { participantViewFor } from "../../content/participantLayer.ts";
import { daysInPhase, phaseById } from "../../content/phases.ts";
import { allWeekNumbers, daysInWeek, weekDayRange, weekLabel } from "../../content/weeks.ts";
import { localStore } from "../../db/store.ts";
import type { DayProgress } from "../../domain/types.ts";
import { completedCount, dayHref } from "../../progress/progress.ts";
import { statusBox } from "../bits.ts";
import { el, text } from "../dom.ts";
import { padDay } from "../motif.ts";
import { weekNav } from "../shell.ts";

export async function renderDaysPage(main: HTMLElement): Promise<void> {
  const rows = await localStore.listProgress();
  const byDay = new Map(rows.map((row) => [row.day, row]));
  const packet = loadCurriculumPacket();
  const done = completedCount(rows);
  const journey = el("div", { class: "journey", "aria-label": "Sixty-day journey" });
  for (const week of allWeekNumbers()) {
    const days = daysInWeek(week);
    const { start, end } = weekDayRange(week);
    const complete = days.filter((day) => byDay.get(day)?.completedAt).length;
    const list = el("ol", { class: "day-rail", start: String(start) });
    for (const day of days) {
      const doc = packet.days.find((item) => item.day === day);
      const label = doc ? participantViewFor(doc).displayTitle : undefined;
      list.append(dayItem(day, byDay.get(day), label));
    }
    journey.append(
      el("section", { class: "week-chapter phase-chapter", id: `week-${week}` }, [
        el("header", { class: "phase-head week-head" }, [
          el("p", { class: "phase-index week-index" }, [weekLabel(week)]),
          el("h3", {}, [el("a", { href: `#/week/${week}` }, [weekLabel(week)])]),
          el("p", { class: "phase-range" }, [`Days ${padDay(start)}–${padDay(end)}`]),
          el("p", { class: "phase-count meta" }, [`${complete} of ${days.length} complete`]),
        ]),
        list,
      ]),
    );
  }
  main.append(
    el("article", { class: "days-surface" }, [
      el("header", { class: "days-intro" }, [
        el("p", { class: "eyebrow" }, ["Nine weeks · 60 days"]),
        el("h2", { class: "display-title" }, ["Days 1–60"]),
        el("p", { class: "lede" }, [
          "One practice per day, grouped by week. Every day stays unlocked. Skip or return anytime — no streaks and no penalties.",
        ]),
        el("p", { class: "meta" }, [`${done} of 60 marked complete on this device.`]),
        weekNav(),
      ]),
      el("p", {
        class: "journey-live",
        id: "journey-live",
        hidden: true,
      }, [" "]),
      journey,
    ]),
  );
}

export async function renderWeekPage(main: HTMLElement, week: number): Promise<void> {
  const weeks = allWeekNumbers();
  if (!weeks.includes(week)) {
    main.append(el("h2", {}, ["Week"]), statusBox("error", "Unknown week", "Choose a week from the day list."));
    return;
  }
  const rows = await localStore.listProgress();
  const byDay = new Map(rows.map((row) => [row.day, row]));
  const packet = loadCurriculumPacket();
  const days = daysInWeek(week);
  const { start, end } = weekDayRange(week);
  const list = el("ol", { class: "day-rail", start: String(start) });
  for (const day of days) {
    const doc = packet.days.find((item) => item.day === day);
    const label = doc ? participantViewFor(doc).displayTitle : undefined;
    list.append(dayItem(day, byDay.get(day), label));
  }
  const index = weeks.indexOf(week);
  const prev = weeks[index - 1];
  const next = weeks[index + 1];
  main.append(
    el("article", { class: "days-surface phase-surface week-surface" }, [
      el("p", { class: "eyebrow" }, [`${weekLabel(week)} · Days ${padDay(start)}–${padDay(end)}`]),
      el("h2", { class: "display-title" }, [weekLabel(week)]),
      el("p", { class: "lede" }, ["All days in this week are unlocked. Open any day to read today's practice."]),
      weekNav(week),
      list,
      el("p", { class: "actions" }, [
        prev ? el("a", { href: `#/week/${prev}` }, [`Previous · ${weekLabel(prev)}`]) : text(""),
        next ? el("a", { href: `#/week/${next}` }, [`Next · ${weekLabel(next)}`]) : text(""),
        el("a", { href: "#/days" }, ["All weeks"]),
      ]),
    ]),
  );
}

/** Legacy phase URLs — map to week of the phase start day without showing interpretive phase names. */
export async function renderPhasePage(main: HTMLElement, phaseId: string): Promise<void> {
  const phase = phaseById(phaseId);
  if (!phase) {
    main.append(el("h2", {}, ["Days"]), statusBox("error", "Unknown section", "Choose a week from the day list."));
    return;
  }
  const rows = await localStore.listProgress();
  const byDay = new Map(rows.map((row) => [row.day, row]));
  const packet = loadCurriculumPacket();
  const list = el("ol", { class: "day-rail", start: String(phase.start) });
  for (const day of daysInPhase(phase)) {
    const doc = packet.days.find((item) => item.day === day);
    const label = doc ? participantViewFor(doc).displayTitle : undefined;
    list.append(dayItem(day, byDay.get(day), label));
  }
  main.append(
    el("article", { class: "days-surface phase-surface" }, [
      el("p", { class: "eyebrow" }, [`Days ${padDay(phase.start)}–${padDay(phase.end)}`]),
      el("h2", { class: "display-title" }, [`Days ${padDay(phase.start)}–${padDay(phase.end)}`]),
      el("p", { class: "lede" }, ["Browse by week from ", el("a", { href: "#/days" }, ["All days"]), " for Week 1–9 navigation."]),
      list,
      el("p", { class: "actions" }, [el("a", { href: "#/days" }, ["All days"])]),
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
