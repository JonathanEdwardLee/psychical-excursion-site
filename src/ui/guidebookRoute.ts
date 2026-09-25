import { isGuidebookChapter05Ready } from "../content/guidebookChapter05.ts";
import {
  canonicalGuidebookPath,
  catalogPageByPath,
  INTRODUCTION_PATH,
  resolveLegacyGuidebookHash,
} from "../content/guidebookCatalog.ts";
import { parseGuidebookHash } from "../content/guidebookAnchors.ts";
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
import {
  CHAPTER_11_HASH,
  CHAPTER_11_PATH,
} from "../content/guidebookChapter11.ts";
import {
  CHAPTER_12_HASH,
  CHAPTER_12_PATH,
} from "../content/guidebookChapter12.ts";
import {
  CHAPTER_13_HASH,
  CHAPTER_13_PATH,
} from "../content/guidebookChapter13.ts";
import {
  CHAPTER_14_HASH,
  CHAPTER_14_PATH,
} from "../content/guidebookChapter14.ts";
import {
  CHAPTER_15_HASH,
  CHAPTER_15_PATH,
} from "../content/guidebookChapter15.ts";
import {
  CHAPTER_16_HASH,
  CHAPTER_16_PATH,
} from "../content/guidebookChapter16.ts";
import {
  CHAPTER_17_HASH,
  CHAPTER_17_PATH,
} from "../content/guidebookChapter17.ts";
import {
  CHAPTER_18_HASH,
  CHAPTER_18_PATH,
} from "../content/guidebookChapter18.ts";
import {
  CHAPTER_19_HASH,
  CHAPTER_19_PATH,
} from "../content/guidebookChapter19.ts";
import {
  CHAPTER_20_HASH,
  CHAPTER_20_PATH,
} from "../content/guidebookChapter20.ts";
import {
  CHAPTER_21_HASH,
  CHAPTER_21_PATH,
} from "../content/guidebookChapter21.ts";
import {
  CHAPTER_22_HASH,
  CHAPTER_22_PATH,
} from "../content/guidebookChapter22.ts";

export type GuidebookPublicPage =
  | "landing"
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
  | "chapter10"
  | "chapter11"
  | "chapter12"
  | "chapter13"
  | "chapter14"
  | "chapter15"
  | "chapter16"
  | "chapter17"
  | "chapter18"
  | "chapter19"
  | "chapter20"
  | "chapter21"
  | "chapter22";

function isJsdom(): boolean {
  return (navigator.userAgent ?? "").includes("jsdom");
}

let locationOverride: { pathname: string; hash: string } | null = null;

/** Test helper: jsdom does not reliably apply history pathname changes. */
export function overrideGuidebookLocation(pathname: string, hash = ""): void {
  locationOverride = { pathname, hash };
}

function readPathname(): string {
  return locationOverride?.pathname ?? window.location.pathname;
}

function readHash(): string {
  return locationOverride?.hash ?? window.location.hash;
}

export function readPublicGuidebookPathname(): string {
  return canonicalGuidebookPath(readPathname());
}

export function inPageGuidebookFragment(hash = readHash()): string {
  if (!hash || hash === "#" || hash.startsWith("#/")) {
    return parseGuidebookHash(hash).fragment;
  }
  return hash.replace(/^#/, "");
}

export function parseGuidebookPublicPage(input?: string): GuidebookPublicPage {
  let path: string;
  if (input?.startsWith("#")) {
    path = resolveLegacyGuidebookHash(input)?.path ?? INTRODUCTION_PATH;
  } else if (input) {
    path = canonicalGuidebookPath(input);
  } else {
    const legacy = resolveLegacyGuidebookHash(readHash());
    path = legacy?.path ?? canonicalGuidebookPath(readPathname());
  }
  const page = catalogPageByPath(path);
  if (!page) return "home";
  if (page.id === "landing") return "landing";
  if (page.id === "home") return "home";
  if (page.id === "chapter05" && !isGuidebookChapter05Ready()) return "home";
  return page.id as GuidebookPublicPage;
}

/** Convert leftover hash-only guidebook URLs to canonical pathnames before render/analytics. */
export function applyGuidebookLocation(): boolean {
  const hash = readHash();
  const pathname = readPathname();
  const legacy = hash.startsWith("#/") ? resolveLegacyGuidebookHash(hash) : null;
  const search = window.location.search;
  if (legacy) {
    const dest = `${legacy.path}${search}${legacy.fragment ? `#${legacy.fragment}` : ""}`;
    locationOverride = { pathname: legacy.path, hash: legacy.fragment ? `#${legacy.fragment}` : "" };
    if (!isJsdom() && legacy.path !== canonicalGuidebookPath(pathname)) {
      window.location.replace(dest);
      return true;
    }
    window.history.replaceState(null, "", dest);
  } else if (hash.startsWith("#/")) {
    locationOverride = { pathname: INTRODUCTION_PATH, hash: "" };
    window.history.replaceState(null, "", `${INTRODUCTION_PATH}${search}`);
  }
  return false;
}

export function normalizeGuidebookPublicHash(): void {
  applyGuidebookLocation();
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
  locationOverride = null;
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
  CHAPTER_11_HASH,
  CHAPTER_11_PATH,
  CHAPTER_12_HASH,
  CHAPTER_12_PATH,
  CHAPTER_13_HASH,
  CHAPTER_13_PATH,
  CHAPTER_14_HASH,
  CHAPTER_14_PATH,
  CHAPTER_15_HASH,
  CHAPTER_15_PATH,
  CHAPTER_16_HASH,
  CHAPTER_16_PATH,
  CHAPTER_17_HASH,
  CHAPTER_17_PATH,
  CHAPTER_18_HASH,
  CHAPTER_18_PATH,
  CHAPTER_19_HASH,
  CHAPTER_19_PATH,
  CHAPTER_20_HASH,
  CHAPTER_20_PATH,
  CHAPTER_21_HASH,
  CHAPTER_21_PATH,
  CHAPTER_22_HASH,
  CHAPTER_22_PATH,
};
