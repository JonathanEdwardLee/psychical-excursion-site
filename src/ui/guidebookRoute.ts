import {
  CHAPTER_01_HASH,
  CHAPTER_01_PATH,
} from "../content/guidebookChapter01.ts";
import {
  CHAPTER_02_HASH,
  CHAPTER_02_PATH,
} from "../content/guidebookChapter02.ts";

export type GuidebookPublicPage = "home" | "chapter01" | "chapter02";

function guidebookPath(hash = window.location.hash): string {
  const raw = hash.replace(/^#/, "").split("?")[0] || "/";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

export function parseGuidebookPublicPage(hash = window.location.hash): GuidebookPublicPage {
  const path = guidebookPath(hash);
  if (path === CHAPTER_01_PATH) return "chapter01";
  if (path === CHAPTER_02_PATH) return "chapter02";
  return "home";
}

export function normalizeGuidebookPublicHash(): void {
  const path = guidebookPath();
  if (path === "/" || path === CHAPTER_01_PATH || path === CHAPTER_02_PATH) return;
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
  if (typeof window.scrollTo === "function" && !navigator.userAgent?.includes("jsdom")) {
    window.scrollTo(0, 0);
  }
}

export function resetGuidebookPageTracking(): void {
  lastGuidebookPage = null;
}

export { CHAPTER_01_HASH, CHAPTER_01_PATH, CHAPTER_02_HASH, CHAPTER_02_PATH };
