import { CHAPTER_01_TITLE } from "../content/guidebookChapter01.ts";
import { applyTheme, readTheme, toggleTheme } from "../theme.ts";
import { el, text } from "./dom.ts";
import { renderAmbientLayer, type AmbientMode } from "./guidebookAmbient.ts";
import type { GuidebookPublicPage } from "./guidebookRoute.ts";
import { bindInPageCitations } from "./guidebookRichText.ts";
import { renderSkyWidget } from "./skyWidget.ts";

export function renderGuidebookChrome(
  root: HTMLElement,
  page: GuidebookPublicPage,
): { main: HTMLElement } {
  applyTheme();
  document.title = page === "chapter01" ? `${CHAPTER_01_TITLE} · Psychical Excursion` : "Psychical Excursion";
  root.replaceChildren();
  const skip = el("a", { class: "skip-link", href: "#main" }, ["Skip to content"]);
  const ambient = renderAmbientLayer(page === "chapter01" ? "memory" : "orbit");
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
    "data-ambient": (page === "chapter01" ? "memory" : "orbit") satisfies AmbientMode,
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
    "aria-checked": dark ? "true" : "false",
    "aria-label": "Dark appearance",
  }, [el("span", { class: "theme-switch-track", "aria-hidden": "true" }, [
    el("span", { class: "theme-switch-thumb" }),
  ])]);
  button.addEventListener("click", () => {
    const mode = toggleTheme();
    const nowDark = mode === "bedtime";
    button.setAttribute("aria-checked", nowDark ? "true" : "false");
  });
  return button;
}
