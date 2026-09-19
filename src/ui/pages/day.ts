import { loadCurriculumPacket } from "../../content/load.ts";
import { PHASES } from "../../content/phases.ts";
import { localStore } from "../../db/store.ts";
import type { DayDocument } from "../../content/model.ts";
import { dayHref, isDayNumber, neighboringDays, phasePosition, resumeDay } from "../../progress/progress.ts";
import { statusBox } from "../bits.ts";
import { announce, el } from "../dom.ts";
import { PHASE_INDEX_MARKS, opticMark, padDay } from "../motif.ts";
import { phaseNav } from "../shell.ts";

export async function renderTodayPage(main: HTMLElement): Promise<void> {
  const rows = await localStore.listProgress();
  const day = resumeDay(rows, await localStore.loadResumeDay());
  await renderDayPage(main, day, { today: true });
}

export async function renderDayPage(
  main: HTMLElement,
  day: number,
  options: { today?: boolean } = {},
): Promise<void> {
  if (!isDayNumber(day)) {
    main.append(el("h2", {}, ["Day"]), statusBox("error", "Unknown day", "Choose a day from 1 to 60."));
    return;
  }
  const document = loadCurriculumPacket().days.find((item) => item.day === day);
  if (!document) {
    main.append(el("h2", {}, ["Day"]), statusBox("error", "Missing day", "That day is not in the local content packet."));
    return;
  }
  const progress = await localStore.markDayVisited(day);
  const neighbors = neighboringDays(day);
  const phase = phasePosition(day);
  const phaseIndex = PHASES.findIndex((item) => item.id === document.phaseId);
  const article = el("article", { class: "day-surface" });
  const reading = el("div", { class: "day-read" });
  reading.append(
    el("p", { class: "eyebrow" }, [
      options.today ? "Today · " : "",
      `Day ${padDay(day)}`,
      phase ? ` · ${PHASE_INDEX_MARKS[phaseIndex] ?? ""} ${phase.name}` : "",
    ]),
  );
  reading.append(el("h2", { id: "day-title", class: "display-title" }, [document.title]));
  if (document.optional) {
    reading.append(
      el("div", { class: "optional-callout" }, [
        statusBox(
          "info",
          "Optional day",
          document.optionalNote ?? "Day 51 is optional. Skip it without penalty.",
        ),
      ]),
    );
  }
  reading.append(renderSections(document));
  const ticks = document.sections.map((section) =>
    el("li", { class: "read-tick", "data-section": section.heading }, [section.heading]),
  );
  const rail = el("aside", { class: "day-rail-panel" }, [
    el("p", { class: "eyebrow" }, [phase ? `${phase.name}` : "Phase"]),
    el("p", { class: "day-rail-index" }, [
      phase ? `${phase.index} of ${phase.length} in this phase` : `Day ${day}`,
    ]),
    el("div", {
      class: "read-progress",
      role: "img",
      "aria-label": "Reading position in this day",
    }, [
      el("div", { class: "read-axis" }, [el("span", { class: "read-bead" })]),
      el("p", { class: "read-place", id: "read-place" }, ["Start"]),
      el("ol", { class: "read-ticks" }, ticks),
    ]),
    phaseNav(document.phaseId),
  ]);
  const completeHost = el("div", { class: "complete-panel" });
  paintComplete(completeHost, day, progress.completedAt !== null);
  rail.append(completeHost);
  rail.append(
    el("nav", { class: "day-pager", "aria-label": "Day sequence" }, [
      neighbors.previous
        ? el("a", { href: dayHref(neighbors.previous), rel: "prev" }, [`Previous · ${padDay(neighbors.previous)}`])
        : el("span", { class: "meta" }, ["No previous day"]),
      neighbors.next
        ? el("a", { href: dayHref(neighbors.next), rel: "next" }, [`Next · ${padDay(neighbors.next)}`])
        : el("span", { class: "meta" }, ["No next day"]),
    ]),
  );
  rail.append(
    el("p", { class: "hint capture-day-hint" }, [
      "Capture is your local journal for this practice — text or voice notes become Journal entries on this device, separate from marking the day complete.",
    ]),
  );
  rail.append(
    el("p", { class: "actions" }, [
      el("a", { href: "#/capture", class: "button primary" }, ["Capture"]),
      el("a", { href: "#/journal", class: "text-link" }, ["Journal"]),
      el("a", { href: "#/days", class: "text-link" }, ["All days"]),
    ]),
  );
  article.append(reading, rail);
  main.append(article);
}

function renderSections(document: DayDocument): HTMLElement {
  const wrap = el("div", { class: "prose day-prose" });
  for (const section of document.sections) {
    const research = /research/i.test(section.heading);
    const block = el("section", { class: research ? "day-section is-research" : "day-section" });
    block.append(el("h3", {}, [section.heading]));
    for (const paragraph of section.paragraphs) {
      block.append(el("p", {}, [paragraph]));
    }
    wrap.append(block);
  }
  return wrap;
}

function paintComplete(host: HTMLElement, day: number, completed: boolean): void {
  host.replaceChildren();
  host.classList.toggle("is-complete", completed);
  host.prepend(opticMark(completed ? "is-lit" : ""));
  if (completed) {
    host.append(
      statusBox("ok", "Day complete on this device", "Completion is stored locally. It is not a streak and can be undone."),
    );
    const undo = el("button", { type: "button", id: "undo-day" }, ["Undo completion"]);
    undo.addEventListener("click", () => {
      void (async () => {
        await localStore.undoDayCompletion(day);
        announce(`Day ${day} marked incomplete`);
        paintComplete(host, day, false);
      })();
    });
    host.append(undo);
    return;
  }
  host.append(
    el("p", { class: "hint" }, [
      "Opening or scrolling this page does not complete the day. Use Complete Day when you want that mark.",
    ]),
  );
  const complete = el("button", { type: "button", id: "complete-day", class: "primary" }, ["Complete Day"]);
  complete.addEventListener("click", () => {
    void (async () => {
      await localStore.completeDay(day);
      announce(`Day ${day} marked complete`);
      paintComplete(host, day, true);
    })();
  });
  host.append(complete);
}
