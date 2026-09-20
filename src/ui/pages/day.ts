import { loadCurriculumPacket } from "../../content/load.ts";
import { participantViewFor } from "../../content/participantLayer.ts";
import { localStore } from "../../db/store.ts";
import type { DayDocument, DaySection } from "../../content/model.ts";
import { dayHref, isDayNumber, neighboringDays, resumeDay, weekPosition } from "../../progress/progress.ts";
import { statusBox } from "../bits.ts";
import { sectionDisplayHeading, sectionKind } from "../instructionDisplay.ts";
import { announce, el } from "../dom.ts";
import { opticMark, padDay } from "../motif.ts";
import { calendarAffirmationPanel } from "../calendarAffirmation.ts";
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
  const participant = participantViewFor(document);
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
  reading.append(el("h2", { id: "day-title", class: "display-title" }, [participant.displayTitle]));
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
  reading.append(renderParticipantContent(participant, document));
  const ticks = [
    ...(participant.setup.length ? ["Before you begin"] : []),
    "Do this",
    ...participant.supporting.map((section) => sectionDisplayHeading(section.heading)),
  ].map((label) => el("li", { class: "read-tick", "data-section": label }, [label]));
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
  const calendarPanel = calendarAffirmationPanel(day);
  if (calendarPanel) rail.append(calendarPanel);
  rail.append(
    el("p", { class: "hint dream-journal-hint" }, [
      "When a dream stands out, save it in your Dream Journal on this device.",
    ]),
  );
  rail.append(
    el("p", { class: "actions day-rail-actions" }, [
      el("a", { href: "#/capture/dream", class: "button primary" }, ["Record a Dream"]),
      el("a", { href: "#/journal", class: "text-link" }, ["Dream Journal"]),
      el("a", { href: "#/days", class: "text-link" }, ["All days"]),
    ]),
  );
  article.append(reading, rail);
  main.append(article);
}

function renderParticipantContent(
  participant: ReturnType<typeof participantViewFor>,
  document: DayDocument,
): HTMLElement {
  const wrap = el("div", { class: "prose day-prose" });
  if (participant.setup.length) {
    const block = el("section", { class: "day-section is-setup" });
    block.append(el("h3", {}, ["Before you begin"]));
    for (const paragraph of participant.setup) {
      block.append(el("p", {}, [paragraph]));
    }
    wrap.append(block);
  }
  const action = el("section", { class: "day-section is-practice day-do-this" });
  action.append(el("h3", { class: "day-instruction-title" }, ["Do this"]));
  for (const paragraph of participant.doThis) {
    action.append(el("p", { class: "day-instruction-line" }, [paragraph]));
  }
  wrap.append(action);
  for (const section of participant.supporting) {
    wrap.append(renderSupportingSection(section));
  }
  if (participant.doThis.some((line) => /record|journal|capture|write|dream/i.test(line))) {
    wrap.append(
      el("p", { class: "hint day-dream-cue" }, [
        "Save anything you want to keep in your ",
        el("a", { href: "#/journal" }, ["Dream Journal"]),
        ".",
      ]),
    );
  } else if (document.day <= 14 || /dream|wake|remember/i.test(participant.displayTitle)) {
    wrap.append(
      el("p", { class: "hint day-dream-cue" }, [
        "If a dream stands out, note it in your ",
        el("a", { href: "#/journal" }, ["Dream Journal"]),
        " after you finish.",
      ]),
    );
  }
  return wrap;
}

function renderSupportingSection(section: DaySection): HTMLElement {
  const kind = sectionKind(section.heading);
  const display = sectionDisplayHeading(section.heading);
  if (kind === "research") {
    const block = el("details", { class: "day-section is-research" });
    block.append(el("summary", {}, [display]));
    for (const paragraph of section.paragraphs) {
      block.append(el("p", {}, [paragraph]));
    }
    return block;
  }
  const block = el("section", { class: `day-section is-${kind}` });
  block.append(el("h3", {}, [display]));
  for (const paragraph of section.paragraphs) {
    block.append(el("p", {}, [paragraph]));
  }
  return block;
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
