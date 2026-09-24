import {
  CHAPTER_01_HASH,
  CHAPTER_01_PATH,
} from "../content/guidebookChapter01.ts";
import {
  CHAPTER_02_HASH,
  CHAPTER_02_PATH,
} from "../content/guidebookChapter02.ts";
import {
  CHAPTER_03_HASH,
  CHAPTER_03_PATH,
} from "../content/guidebookChapter03.ts";
import {
  CHAPTER_04_HASH,
  CHAPTER_04_PATH,
} from "../content/guidebookChapter04.ts";
import {
  CHAPTER_05_HASH,
  CHAPTER_05_PATH,
  isGuidebookChapter05Ready,
} from "../content/guidebookChapter05.ts";
import {
  CHAPTER_06_HASH,
  CHAPTER_06_PATH,
} from "../content/guidebookChapter06.ts";
import {
  CHAPTER_07_HASH,
  CHAPTER_07_PATH,
} from "../content/guidebookChapter07.ts";
import {
  CHAPTER_08_HASH,
  CHAPTER_08_PATH,
} from "../content/guidebookChapter08.ts";
import {
  CHAPTER_09_HASH,
  CHAPTER_09_PATH,
} from "../content/guidebookChapter09.ts";
import {
  CHAPTER_10_HASH,
  CHAPTER_10_PATH,
} from "../content/guidebookChapter10.ts";
import { parseGuidebookHash } from "../content/guidebookAnchors.ts";

export type GuidebookPublicPage =
  | "home"
  | "chapter01"
  | "chapter02"
  | "chapter03"
  | "chapter04"
  | "chapter05"
  | "chapter06"
  | "chapter07"
  | "chapter08"
  | "chapter09"
  | "chapter10";

function guidebookPath(hash = window.location.hash): string {
  return parseGuidebookHash(hash).path;
}

export function parseGuidebookPublicPage(hash = window.location.hash): GuidebookPublicPage {
  const path = guidebookPath(hash);
  if (path === CHAPTER_01_PATH) return "chapter01";
  if (path === CHAPTER_02_PATH) return "chapter02";
  if (path === CHAPTER_03_PATH) return "chapter03";
  if (path === CHAPTER_04_PATH) return "chapter04";
  if (path === CHAPTER_05_PATH && isGuidebookChapter05Ready()) return "chapter05";
  if (path === CHAPTER_06_PATH) return "chapter06";
  if (path === CHAPTER_07_PATH) return "chapter07";
  if (path === CHAPTER_08_PATH) return "chapter08";
  if (path === CHAPTER_09_PATH) return "chapter09";
  if (path === CHAPTER_10_PATH) return "chapter10";
  return "home";
}

export function normalizeGuidebookPublicHash(): void {
  const { path } = parseGuidebookHash();
  if (
    path === "/" ||
    path === CHAPTER_01_PATH ||
    path === CHAPTER_02_PATH ||
    path === CHAPTER_03_PATH ||
    path === CHAPTER_04_PATH
  ) {
    return;
  }
  if (path === CHAPTER_05_PATH && isGuidebookChapter05Ready()) return;
  if (path === CHAPTER_06_PATH) return;
  if (path === CHAPTER_07_PATH) return;
  if (path === CHAPTER_08_PATH) return;
  if (path === CHAPTER_09_PATH) return;
  if (path === CHAPTER_10_PATH) return;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#/`);
}

export function isGuidebookHomeHash(): boolean {
  return parseGuidebookPublicPage() === "home";
}

let lastGuidebookPage: GuidebookPublicPage | null = null;

export function guidebookPageChanged(page: GuidebookPublicPage): boolean {
  return lastGuidebookPage !== page;
}

export function markGuidebookPage(page: GuidebookPublicPage): void {
  lastGuidebookPage = page;
}

/** Reset window scroll when the guidebook page identity changes. Citations do not change page identity. */
export function resetGuidebookWindowScroll(): void {
  if (typeof history !== "undefined" && "scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  const ua = navigator.userAgent ?? "";
  if (typeof window.scrollTo === "function" && ua.length > 0 && !ua.includes("jsdom")) {
    window.scrollTo(0, 0);
  }
}

export function scrollGuidebookSection(root: HTMLElement, fragment: string): void {
  if (!fragment) return;
  const target = root.querySelector<HTMLElement>(`[id="${fragment}"]`);
  if (!target) return;
  target.closest(".guidebook-section")?.classList.add("is-visible");
  const ua = navigator.userAgent ?? "";
  if (typeof target.scrollIntoView === "function" && ua.length > 0 && !ua.includes("jsdom")) {
    const reduced = typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }
  target.focus({ preventScroll: true });
}

export function resetGuidebookPageTracking(): void {
  lastGuidebookPage = null;
}

export {
  CHAPTER_01_HASH,
  CHAPTER_01_PATH,
  CHAPTER_02_HASH,
  CHAPTER_02_PATH,
  CHAPTER_03_HASH,
  CHAPTER_03_PATH,
  CHAPTER_04_HASH,
  CHAPTER_04_PATH,
  CHAPTER_05_HASH,
  CHAPTER_05_PATH,
  CHAPTER_06_HASH,
  CHAPTER_06_PATH,
  CHAPTER_07_HASH,
  CHAPTER_07_PATH,
  CHAPTER_08_HASH,
  CHAPTER_08_PATH,
  CHAPTER_09_HASH,
  CHAPTER_09_PATH,
  CHAPTER_10_HASH,
  CHAPTER_10_PATH,
};
