import { CHAPTER_01_HASH, CHAPTER_01_PATH } from "../content/guidebookChapter01.ts";

export type GuidebookPublicPage = "home" | "chapter01";

function guidebookPath(hash = window.location.hash): string {
  const raw = hash.replace(/^#/, "").split("?")[0] || "/";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

export function parseGuidebookPublicPage(hash = window.location.hash): GuidebookPublicPage {
  return guidebookPath(hash) === CHAPTER_01_PATH ? "chapter01" : "home";
}

export function normalizeGuidebookPublicHash(): void {
  const path = guidebookPath();
  if (path === "/" || path === CHAPTER_01_PATH) return;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#/`);
}

export function isGuidebookHomeHash(): boolean {
  return parseGuidebookPublicPage() === "home";
}

export { CHAPTER_01_HASH, CHAPTER_01_PATH };
