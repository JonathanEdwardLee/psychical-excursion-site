import { localStore } from "../../db/store.ts";
import { allWeekNumbers, daysInWeek, weekDayRange, weekLabel, weekLabelForDay } from "../../content/weeks.ts";
import { completedCount, resumeDay } from "../../progress/progress.ts";
import { ABOUT_PARAGRAPHS, EVIDENCE_PARAGRAPHS, METHOD_PARAGRAPHS } from "../copy.ts";
import { el, formatWhen, text } from "../dom.ts";
import { padDay } from "../motif.ts";

export async function renderHomePage(main: HTMLElement): Promise<void> {
  const entries = await safeList();
  const rows = await safeProgress();
  const resume = resumeDay(rows, await localStore.loadResumeDay());
  const done = completedCount(rows);
  const latest = entries[0];
  const isNew = done === 0 && !latest;
  const ctaLabel = isNew ? "Start Day 1" : "Continue today's practice";
  const weekStrip = el("ol", { class: "phase-dial week-dial", "aria-label": "Weeks in the 60-day practice" });
  for (const week of allWeekNumbers()) {
    const days = daysInWeek(week);
    const { start, end } = weekDayRange(week);
    const inWeek = rows.filter((row) => row.day >= start && row.day <= end);
    const complete = inWeek.filter((row) => row.completedAt).length;
    const current = resume >= start && resume <= end;
    weekStrip.append(
      el("li", { class: `phase-dial-item${current ? " is-current" : ""}${complete === days.length ? " is-complete" : ""}` }, [
        el("a", { href: `#/week/${week}` }, [
          el("span", { class: "phase-dial-name" }, [weekLabel(week)]),
          el("span", { class: "phase-dial-range" }, [`Days ${padDay(start)}–${padDay(end)}`]),
        ]),
      ]),
    );
  }
  main.append(
    el("article", { class: "home-surface" }, [
      el("div", { class: "home-hero" }, [
        el("div", { class: "home-identity" }, [
          el("p", { class: "eyebrow" }, ["Psychical Excursion"]),
          el("h2", { class: "display-title" }, ["60-day personal practice"]),
          el("p", { class: "lede" }, [
            "One guided day at a time for 60 days. Read today's practice, capture dreams or experiences in your Journal, and mark days complete when you're ready. No account required. Google backup and Astronomy are optional extras.",
          ]),
          el("details", { class: "home-orientation" }, [
            el("summary", {}, ["How this works"]),
            el("ul", { class: "plain home-how-list" }, [
              el("li", {}, ["Open ", el("strong", {}, ["Today"]), " for the current day's practice."]),
              el("li", {}, ["Use ", el("strong", {}, ["Capture"]), " to save text or voice notes to your Journal."]),
              el("li", {}, ["Browse ", el("strong", {}, ["Days"]), " by week (Week 1, Week 2, …)."]),
              el("li", {}, ["Optional: connect Google Drive on ", el("a", { href: "#/account" }, ["Account"]), " for backup."]),
            ]),
          ]),
        ]),
        el("aside", { class: "home-now", "aria-label": "Resume" }, [
          el("p", { class: "eyebrow" }, ["Now"]),
          el("p", { class: "home-now-day" }, [`Day ${padDay(resume)} of 60 · ${weekLabelForDay(resume)}`]),
          el("p", { class: "meta home-progress-copy" }, [`${done} of 60 days marked complete on this device.`]),
          el("div", {
            class: "axis-meter",
            role: "img",
            "aria-label": `${done} of 60 days complete`,
          }, [
            el("span", {
              class: "axis-meter-fill",
              style: `--complete:${done / 60}`,
            }),
          ]),
          el("div", { class: "actions" }, [
            el("a", { href: "#/today", class: "button primary", id: "home-today" }, [ctaLabel]),
            el("a", { href: "#/capture", class: "button", id: "home-capture" }, ["Capture to Journal"]),
            el("a", { href: "#/capture/night/dream", class: "button quiet", id: "home-night-capture" }, ["Night capture"]),
          ]),
          el("p", { class: "hint" }, [
            isNew
              ? "After practice, capture anything you want to remember, then return tomorrow for the next day."
              : "Your Journal holds saved entries. Today always opens your current practice day.",
          ]),
          latest
            ? el("p", { class: "meta" }, [`Latest Journal entry: ${formatWhen(latest.createdAt)}`])
            : el("p", { class: "meta" }, ["Journal is empty — Capture saves your first entry here."]),
        ]),
      ]),
      weekStrip,
    ]),
  );
}

export async function renderMethodPage(main: HTMLElement): Promise<void> {
  main.append(
    el("article", { class: "surface prose editorial-page" }, [
      el("p", { class: "eyebrow" }, ["How it works"]),
      el("h2", { class: "display-title" }, ["Method"]),
      ...METHOD_PARAGRAPHS.map((paragraph) => el("p", {}, [paragraph])),
      el("p", {}, [el("a", { href: "#/days" }, ["All days"]), text(" · "), el("a", { href: "#/today" }, ["Today"])]),
    ]),
  );
}

export async function renderAboutPage(main: HTMLElement): Promise<void> {
  main.append(
    el("article", { class: "surface prose editorial-page" }, [
      el("p", { class: "eyebrow" }, ["Source and stance"]),
      el("h2", { class: "display-title" }, ["About"]),
      ...ABOUT_PARAGRAPHS.map((paragraph) => el("p", {}, [paragraph])),
      el("h3", {}, ["Evidence, safety, source"]),
      ...EVIDENCE_PARAGRAPHS.map((paragraph) => el("p", {}, [paragraph])),
      el("p", {}, [el("a", { href: "#/data" }, ["Data and export on this device"])]),
    ]),
  );
}

async function safeList() {
  try {
    return await localStore.listEntries();
  } catch {
    return [];
  }
}

async function safeProgress() {
  try {
    return await localStore.listProgress();
  } catch {
    return [];
  }
}
