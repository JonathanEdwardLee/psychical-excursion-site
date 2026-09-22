import { CHAPTER_01_TITLE } from "../content/guidebookChapter01.ts";
import { CHAPTER_02_TITLE } from "../content/guidebookChapter02.ts";
import { CHAPTER_03_TITLE } from "../content/guidebookChapter03.ts";
import { applyTheme, readTheme, toggleTheme } from "../theme.ts";
import { el, text } from "./dom.ts";
import { renderAmbientLayer, type AmbientMode } from "./guidebookAmbient.ts";
import type { GuidebookPublicPage } from "./guidebookRoute.ts";
import { bindInPageCitations } from "./guidebookRichText.ts";
import { renderSkyWidget } from "./skyWidget.ts";

function ambientFor(page: GuidebookPublicPage): AmbientMode {
  if (page === "chapter01") return "memory";
  if (page === "chapter02") return "notice";
  if (page === "chapter03") return "recognize";
  return "orbit";
}

function documentTitleFor(page: GuidebookPublicPage): string {
  if (page === "chapter01") return `${CHAPTER_01_TITLE} · Psychical Excursion`;
  if (page === "chapter02") return `${CHAPTER_02_TITLE} · Psychical Excursion`;
  if (page === "chapter03") return `${CHAPTER_03_TITLE} · Psychical Excursion`;
  return "Psychical Excursion";
}

export function renderGuidebookChrome(
  root: HTMLElement,
  page: GuidebookPublicPage,
): { main: HTMLElement } {
  applyTheme();
  document.title = documentTitleFor(page);
  root.replaceChildren();
  const skip = el("a", { class: "skip-link", href: "#main" }, ["Skip to content"]);
  const ambientMode = ambientFor(page);
  const ambient = renderAmbientLayer(ambientMode);
  const themeBtn = themeSwitch();
  const header = el("header", { class: "app-header guidebook-header" }, [
    el("a", { href: "#/", class: "brand-link", "aria-label": "Psychical Excursion home" }, [
      el("img", {
        class: "brand-logo brand-logo-light",
        src: "/brand/pex-logo-primary.svg",
        alt: "",
        width: "220",
        height: "52",
        decoding: "async",
      }),
      el("img", {
        class: "brand-logo brand-logo-reverse",
        src: "/brand/pex-logo-primary-reverse.svg",
        alt: "",
        width: "220",
        height: "52",
        decoding: "async",
      }),
    ]),
    el("div", { class: "header-tools guidebook-tools" }, [
      renderSkyWidget(),
      el("span", { class: "guidebook-tools-rule", "aria-hidden": "true" }),
      themeBtn,
    ]),
  ]);
  const live = el("div", { id: "live-status", class: "visually-hidden", "aria-live": "polite" });
  const main = el("main", {
    id: "main",
    class: "main-stage guidebook-main",
    tabindex: "-1",
    "data-guidebook-page": page,
  });
  const footer = el("footer", { class: "site-footer guidebook-footer" }, [
    el("p", { class: "attribution" }, [
      text("Website by "),
      el("a", { href: "https://hoopsnakedesigns.com/", rel: "noreferrer" }, ["Hoopsnake Designs"]),
    ]),
  ]);
  const frame = el("div", {
    class: "app-frame guidebook-frame",
    "data-ambient": ambientMode satisfies AmbientMode,
  }, [header, live, main, footer]);
  root.append(skip, ambient, frame);
  return { main };
}

export function finalizeGuidebookPage(root: HTMLElement): void {
  bindInPageCitations(root);
}

function themeSwitch(): HTMLButtonElement {
  const dark = readTheme() === "bedtime";
  const button = el("button", {
    type: "button",
    id: "theme-light-dark",
    class: "theme-switch",
    role: "switch",
    dir: "ltr",
    "aria-checked": dark ? "true" : "false",
    "aria-label": "Dark appearance",
  }, [el("span", { class: "theme-switch-track", "aria-hidden": "true", dir: "ltr" }, [
    el("span", { class: "theme-switch-thumb" }),
  ])]);
  button.addEventListener("click", () => {
    const mode = toggleTheme();
    const nowDark = mode === "bedtime";
    button.setAttribute("aria-checked", nowDark ? "true" : "false");
  });
  return button;
}
