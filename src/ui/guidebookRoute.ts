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
import { parseGuidebookHash } from "../content/guidebookAnchors.ts";

export type GuidebookPublicPage =
  | "home"
  | "chapter01"
  | "chapter02"
  | "chapter03"
  | "chapter04"
  | "chapter05";

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
};
