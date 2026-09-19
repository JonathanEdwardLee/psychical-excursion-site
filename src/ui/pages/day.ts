import { loadCurriculumPacket } from "../../content/load.ts";
import { localStore } from "../../db/store.ts";
import type { DayDocument } from "../../content/model.ts";
import { dayHref, isDayNumber, neighboringDays, resumeDay, weekPosition } from "../../progress/progress.ts";
import { statusBox } from "../bits.ts";
import { sectionDisplayHeading, sectionKind } from "../instructionDisplay.ts";
import { announce, el } from "../dom.ts";
import { opticMark, padDay } from "../motif.ts";
import { weekNav } from "../shell.ts";

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
  await localStore.markDayVisited(day);
  const progress = await localStore.getDayProgress(day);
  const neighbors = neighboringDays(day);
  const week = weekPosition(day);
  const article = el("article", { class: "day-surface" });
  const reading = el("div", { class: "day-read" });
  reading.append(
    el("p", { class: "eyebrow" }, [
      options.today ? "Today · " : "",
      `Day ${padDay(day)} of 60`,
      week ? ` · ${week.label}` : "",
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
    el("li", { class: "read-tick", "data-section": sectionDisplayHeading(section.heading) }, [
      sectionDisplayHeading(section.heading),
    ]),
  );
  const rail = el("aside", { class: "day-rail-panel" }, [
    el("p", { class: "eyebrow" }, [week ? week.label : "Week"]),
    el("p", { class: "day-rail-index" }, [
      week ? `Day ${week.index} of ${week.length} this week` : `Day ${day}`,
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
    weekNav(week?.week),
  ]);
  const completeHost = el("div", { class: "complete-panel" });
  paintComplete(completeHost, day, progress.completedAt !== null, neighbors.next);
  rail.append(completeHost);
  rail.append(
    el("nav", { class: "day-pager", "aria-label": "Day sequence" }, [
      neighbors.previous
        ? el("a", { href: dayHref(neighbors.previous), rel: "prev" }, [`Previous · Day ${padDay(neighbors.previous)}`])
        : el("span", { class: "meta" }, ["No previous day"]),
      neighbors.next
        ? el("a", { href: dayHref(neighbors.next), rel: "next" }, [`Next · Day ${padDay(neighbors.next)}`])
        : el("span", { class: "meta" }, ["No next day"]),
    ]),
  );
  rail.append(
    el("p", { class: "hint capture-day-hint" }, [
      "Capture saves dreams, experiences, or sensations to your Journal on this device. Marking the day complete is separate.",
    ]),
  );
  rail.append(
    el("p", { class: "actions" }, [
      el("a", { href: "#/capture", class: "button primary" }, ["Capture to Journal"]),
      el("a", { href: "#/journal", class: "text-link" }, ["Open Journal"]),
      el("a", { href: "#/days", class: "text-link" }, ["All days"]),
    ]),
  );
  article.append(reading, rail);
  main.append(article);
}

function renderSections(document: DayDocument): HTMLElement {
  const wrap = el("div", { class: "prose day-prose" });
  const ordered = [...document.sections].sort((a, b) => sectionSortRank(a.heading) - sectionSortRank(b.heading));
  for (const section of ordered) {
    const kind = sectionKind(section.heading);
    const display = sectionDisplayHeading(section.heading);
    if (kind === "research") {
      const block = el("details", { class: "day-section is-research" });
      block.append(el("summary", {}, [display]));
      for (const paragraph of section.paragraphs) {
        block.append(el("p", {}, [paragraph]));
      }
      wrap.append(block);
      continue;
    }
    const block = el("section", {
      class: `day-section is-${kind}${kind === "practice" ? " day-do-this" : ""}`,
    });
    const headingTag = kind === "practice" ? "h3" : "h3";
    block.append(el(headingTag, { class: kind === "practice" ? "day-instruction-title" : "" }, [display]));
    for (const paragraph of section.paragraphs) {
      block.append(el("p", {}, [paragraph]));
    }
    wrap.append(block);
  }
  return wrap;
}

function sectionSortRank(heading: string): number {
  const key = heading.trim().toUpperCase();
  if (key === "TODAY") return 0;
  if (key === "PRACTICE") return 1;
  if (key === "TONIGHT") return 2;
  if (key === "AFFIRMATION") return 3;
  if (key === "RESEARCH NOTE") return 4;
  return 5;
}

function paintComplete(host: HTMLElement, day: number, completed: boolean, nextDay: number | null): void {
  host.replaceChildren();
  host.classList.toggle("is-complete", completed);
  host.prepend(opticMark(completed ? "is-lit" : ""));
  if (completed) {
    host.append(
      statusBox("ok", "Day marked complete", "Stored on this device only. You can undo this anytime."),
    );
    const undo = el("button", { type: "button", id: "undo-day" }, ["Undo completion"]);
    undo.addEventListener("click", () => {
      void (async () => {
        await localStore.undoDayCompletion(day);
        announce(`Day ${day} marked incomplete`);
        paintComplete(host, day, false, nextDay);
      })();
    });
    host.append(undo);
    host.append(
      el("p", { class: "actions" }, [
        el("a", { href: "#/today", class: "button" }, ["Back to today"]),
        nextDay ? el("a", { href: dayHref(nextDay), class: "button primary" }, [`Start Day ${nextDay}`]) : el("span"),
        el("a", { href: "#/journal", class: "text-link" }, ["Journal"]),
      ]),
    );
    return;
  }
  host.append(
    el("p", { class: "hint" }, [
      "Opening this page does not mark the day complete. Tap Complete Day when you are done with today's practice.",
    ]),
  );
  const complete = el("button", { type: "button", id: "complete-day", class: "primary" }, ["Complete Day"]);
  complete.addEventListener("click", () => {
    void (async () => {
      await localStore.completeDay(day);
      announce(`Day ${day} marked complete`);
      paintComplete(host, day, true, nextDay);
    })();
  });
  host.append(complete);
}
