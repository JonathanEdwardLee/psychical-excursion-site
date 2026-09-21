import { applyTheme, readTheme, toggleTheme } from "../theme.ts";
import { el, text } from "./dom.ts";
import { renderSkyWidget } from "./skyWidget.ts";

export function renderGuidebookChrome(root: HTMLElement): { main: HTMLElement } {
  applyTheme();
  root.replaceChildren();
  const skip = el("a", { class: "skip-link", href: "#main" }, ["Skip to content"]);
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
      el("h1", { class: "guidebook-title" }, ["Psychical Excursion"]),
    ]),
    el("div", { class: "header-tools guidebook-tools" }, [
      renderSkyWidget(),
      themeBtn,
    ]),
  ]);
  const main = el("main", { id: "main", class: "main-stage guidebook-main", tabindex: "-1" });
  const footer = el("footer", { class: "site-footer guidebook-footer" }, [
    el("p", { class: "attribution" }, [
      text("Website by "),
      el("a", { href: "https://hoopsnakedesigns.com/", rel: "noreferrer" }, ["Hoopsnake Designs"]),
    ]),
  ]);
  root.append(skip, el("div", { class: "app-frame guidebook-frame" }, [header, main, footer]));
  return { main };
}

function themeSwitch(): HTMLButtonElement {
  const dark = readTheme() === "bedtime";
  const button = el("button", {
    type: "button",
    id: "theme-light-dark",
    class: "theme-light-dark",
    "aria-pressed": dark ? "true" : "false",
    "aria-label": dark ? "Switch to light mode" : "Switch to dark mode",
  }, [dark ? "Light" : "Dark"]);
  button.addEventListener("click", () => {
    const mode = toggleTheme();
    const nowDark = mode === "bedtime";
    button.textContent = nowDark ? "Light" : "Dark";
    button.setAttribute("aria-pressed", nowDark ? "true" : "false");
    button.setAttribute("aria-label", nowDark ? "Switch to light mode" : "Switch to dark mode");
  });
  return button;
}
