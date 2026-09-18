import { loadCurriculumPacket } from "../../content/load.ts";
import { localStore } from "../../db/store.ts";
import type { DayDocument } from "../../content/model.ts";
import { dayHref, isDayNumber, neighboringDays, phasePosition, resumeDay } from "../../progress/progress.ts";
import { statusBox } from "../bits.ts";
import { announce, el } from "../dom.ts";
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
  const article = el("article", { class: "surface day-surface" });
  if (options.today) {
    article.append(el("p", { class: "eyebrow" }, ["Today"]));
  }
  article.append(
    el("p", { class: "eyebrow" }, [
      phase ? `${phase.name} · ${phase.index} of ${phase.length}` : "Day",
    ]),
  );
  article.append(el("h2", { id: "day-title" }, [document.title]));
  if (document.source === "development-fixture") {
    article.append(
      statusBox(
        "info",
        "DEVELOPMENT FIXTURE",
        "This is not canonical curriculum. Exact meaning and section order of the locked packet will replace this scaffold. Fixture copy must not remain when requesting Complete Product acceptance.",
      ),
    );
  }
  if (document.optional) {
    article.append(
      statusBox(
        "info",
        "Optional day",
        document.optionalNote ?? "Day 51 is optional. Skip it without penalty.",
      ),
    );
  }
  article.append(phaseNav(document.phaseId));
  article.append(renderSections(document));
  const completeHost = el("div", { class: "complete-panel" });
  paintComplete(completeHost, day, progress.completedAt !== null);
  article.append(completeHost);
  article.append(
    el("nav", { class: "day-pager", "aria-label": "Day sequence" }, [
      neighbors.previous
        ? el("a", { href: dayHref(neighbors.previous), rel: "prev" }, [`Previous · Day ${neighbors.previous}`])
        : el("span", { class: "meta" }, ["No previous day"]),
      neighbors.next
        ? el("a", { href: dayHref(neighbors.next), rel: "next" }, [`Next · Day ${neighbors.next}`])
        : el("span", { class: "meta" }, ["No next day"]),
    ]),
  );
  article.append(
    el("p", { class: "actions" }, [
      el("a", { href: "#/capture", class: "button primary" }, ["Capture"]),
      el("a", { href: "#/days" }, ["All days"]),
    ]),
  );
  main.append(article);
}

function renderSections(document: DayDocument): HTMLElement {
  const wrap = el("div", { class: "prose day-prose" });
  for (const section of document.sections) {
    wrap.append(el("h3", {}, [section.heading]));
    for (const paragraph of section.paragraphs) {
      wrap.append(el("p", {}, [paragraph]));
    }
  }
  return wrap;
}

function paintComplete(host: HTMLElement, day: number, completed: boolean): void {
  host.replaceChildren();
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
