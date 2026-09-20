import { localStore } from "../../db/store.ts";
import { allWeekNumbers, daysInWeek, weekDayRange, weekLabel, weekLabelForDay } from "../../content/weeks.ts";
import { completedCount, resumeDay } from "../../progress/progress.ts";
import { ABOUT_PARAGRAPHS, EVIDENCE_PARAGRAPHS, METHOD_PARAGRAPHS } from "../copy.ts";
import { el, formatWhen, text } from "../dom.ts";
import { padDay } from "../motif.ts";

const HOME_PROMISE =
  "A free 60-day guide to dream recall, focused attention, lucid dreaming, and unusual sleep-edge experiences—including what some call astral projection. No particular belief required, and no outcome promised.";

const HOME_PROGRESSION =
  "Remember dreams → train attention → recognize the dream and sleep edge → explore gently → learn what works for you.";

export async function renderHomePage(main: HTMLElement): Promise<void> {
  const entries = await safeList();
  const rows = await safeProgress();
  const resume = resumeDay(rows, await localStore.loadResumeDay());
  const done = completedCount(rows);
  const latest = entries[0];
  const isNew = done === 0 && !latest;
  const ctaHref = isNew ? "#/day/1" : "#/today";
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
          el("h2", { class: "display-title" }, ["60-day guide"]),
          el("p", { class: "lede home-promise", id: "home-promise" }, [HOME_PROMISE]),
          el("p", { class: "meta home-progression", id: "home-progression" }, [HOME_PROGRESSION]),
          el("div", { class: "actions home-primary-actions" }, [
            el("a", { href: ctaHref, class: "button primary", id: "home-start-day" }, [ctaLabel]),
            el("a", { href: "#/days", class: "button", id: "home-see-path" }, ["See the 60-day path"]),
          ]),
          el("p", { class: "hint home-without-signin" }, [
            "Read every day and use the Astronomy Clock without signing in. Sign in when you want saved progress, Dream Journal backup, or Calendar reminders.",
          ]),
        ]),
        el("aside", { class: "home-now", "aria-label": "Your place in the guide" }, [
          el("p", { class: "eyebrow" }, ["Your place"]),
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
            el("a", { href: "#/journal", class: "button quiet", id: "home-dream-journal" }, ["Dream Journal"]),
            el("a", { href: "#/astronomy", class: "button quiet", id: "home-astronomy" }, ["Astronomy Clock"]),
          ]),
          latest
            ? el("p", { class: "meta" }, [`Latest dream entry: ${formatWhen(latest.createdAt)}`])
            : el("p", { class: "meta" }, ["Dream Journal is empty until you record a dream."]),
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
      el("p", {}, [el("a", { href: "#/data" }, ["Your data on this device"])]),
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
