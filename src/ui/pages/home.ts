import { localStore } from "../../db/store.ts";
import { PHASES, phaseForDay } from "../../content/phases.ts";
import { completedCount, resumeDay } from "../../progress/progress.ts";
import { ABOUT_PARAGRAPHS, EVIDENCE_PARAGRAPHS, METHOD_PARAGRAPHS } from "../copy.ts";
import { el, formatWhen, text } from "../dom.ts";
import { PHASE_INDEX_MARKS, padDay } from "../motif.ts";

export async function renderHomePage(main: HTMLElement): Promise<void> {
  const entries = await safeList();
  const rows = await safeProgress();
  const resume = resumeDay(rows, await localStore.loadResumeDay());
  const done = completedCount(rows);
  const latest = entries[0];
  const phase = phaseForDay(resume);
  const phaseIndex = phase ? PHASES.findIndex((item) => item.id === phase.id) : 0;
  const dial = el("ol", { class: "phase-dial", "aria-label": "Eight-phase journey" });
  PHASES.forEach((item, index) => {
    const inPhase = rows.filter((row) => row.day >= item.start && row.day <= item.end);
    const complete = inPhase.filter((row) => row.completedAt).length;
    const total = item.end - item.start + 1;
    const current = item.id === phase?.id;
    dial.append(
      el("li", { class: `phase-dial-item${current ? " is-current" : ""}${complete === total ? " is-complete" : ""}` }, [
        el("a", { href: `#/phase/${item.id}` }, [
          el("span", { class: "phase-dial-mark" }, [PHASE_INDEX_MARKS[index] ?? ""]),
          el("span", { class: "phase-dial-name" }, [item.name]),
          el("span", { class: "phase-dial-range" }, [`${padDay(item.start)}–${padDay(item.end)}`]),
        ]),
      ]),
    );
  });
  main.append(
    el("article", { class: "home-surface" }, [
      el("div", { class: "home-hero" }, [
        el("div", { class: "home-identity" }, [
          el("p", { class: "eyebrow" }, ["Psychical Excursion"]),
          el("h2", { class: "display-title" }, ["A quiet 60-day instrument"]),
          el("p", { class: "lede" }, [
            "A 60-day, belief-optional reading and journal instrument. Notes and recordings stay on this device. They are not cloud backed up.",
          ]),
        ]),
        el("aside", { class: "home-now", "aria-label": "Resume" }, [
          el("p", { class: "eyebrow" }, ["Now"]),
          el("p", { class: "home-now-day" }, [`Day ${padDay(resume)}`]),
          el("p", { class: "home-now-phase" }, [
            phase ? `${PHASE_INDEX_MARKS[phaseIndex]} · ${phase.name}` : "Journey",
          ]),
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
            el("a", { href: "#/today", class: "button primary", id: "home-today" }, [`Continue · Day ${resume}`]),
            el("a", { href: "#/capture", class: "button", id: "home-capture" }, ["Capture"]),
          ]),
          el("p", { class: "hint" }, ["Returning capture: open the app, then Capture. That is one intentional action."]),
          latest
            ? el("p", { class: "meta" }, [`Latest local entry: ${formatWhen(latest.createdAt)}`])
            : el("p", { class: "meta" }, ["Journal is empty on this device."]),
        ]),
      ]),
      dial,
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
