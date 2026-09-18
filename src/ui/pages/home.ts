import { localStore } from "../../db/store.ts";
import { completedCount, resumeDay } from "../../progress/progress.ts";
import { ABOUT_PARAGRAPHS, EVIDENCE_PARAGRAPHS, METHOD_PARAGRAPHS } from "../copy.ts";
import { el, formatWhen, text } from "../dom.ts";
import { phaseNav } from "../shell.ts";

export async function renderHomePage(main: HTMLElement): Promise<void> {
  const entries = await safeList();
  const rows = await safeProgress();
  const resume = resumeDay(rows, await localStore.loadResumeDay());
  const done = completedCount(rows);
  const latest = entries[0];
  main.append(
    el("article", { class: "surface home-surface" }, [
      el("p", { class: "eyebrow" }, ["Local practice"]),
      el("h2", {}, ["Psychical Excursion"]),
      el("p", { class: "lede" }, [
        "A 60-day, belief-optional reading and journal instrument. Notes and recordings stay on this device. They are not cloud backed up.",
      ]),
      el("p", { class: "meta" }, [`${done} of 60 days marked complete on this device.`]),
      el("div", { class: "actions" }, [
        el("a", { href: "#/capture", class: "button primary", id: "home-capture" }, ["Capture"]),
        el("a", { href: "#/today", class: "button", id: "home-today" }, [`Today · Day ${resume}`]),
      ]),
      el("p", { class: "hint" }, ["Returning capture: open the app, then Capture. That is one intentional action."]),
      latest
        ? el("p", { class: "meta" }, [`Latest local entry: ${formatWhen(latest.createdAt)}`])
        : el("p", { class: "meta" }, ["Journal is empty on this device."]),
      phaseNav(),
    ]),
  );
}

export async function renderMethodPage(main: HTMLElement): Promise<void> {
  main.append(
    el("article", { class: "surface prose" }, [
      el("h2", {}, ["Method"]),
      ...METHOD_PARAGRAPHS.map((paragraph) => el("p", {}, [paragraph])),
      el("p", {}, [el("a", { href: "#/days" }, ["All days"]), text(" · "), el("a", { href: "#/today" }, ["Today"])]),
    ]),
  );
}

export async function renderAboutPage(main: HTMLElement): Promise<void> {
  main.append(
    el("article", { class: "surface prose" }, [
      el("h2", {}, ["About"]),
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
