import { catalogPageByPublicPage } from "../content/guidebookCatalog.ts";
import { guidebookBookChapters } from "../content/guidebookBookChapters.ts";
import { el } from "./dom.ts";
import type { GuidebookPublicPage } from "./guidebookRoute.ts";

const PANEL_ID = "guidebook-chapter-panel";
const TRIGGER_ID = "guidebook-chapter-trigger";

let menuAbort: AbortController | null = null;

export function stopGuidebookChapterMenu(): void {
  menuAbort?.abort();
  menuAbort = null;
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function menuIcon(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", "guidebook-chapter-icon");
  svg.setAttribute("focusable", "false");
  const diamond = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  diamond.setAttribute("points", "12,3 21,12 12,21 3,12");
  diamond.setAttribute("class", "guidebook-chapter-icon-diamond");
  const square = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  square.setAttribute("points", "8,8 16,8 16,16 8,16");
  square.setAttribute("class", "guidebook-chapter-icon-square");
  const point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  point.setAttribute("cx", "12");
  point.setAttribute("cy", "12");
  point.setAttribute("r", "1.1");
  point.setAttribute("class", "guidebook-chapter-icon-point");
  svg.append(diamond, square, point);
  return svg;
}

function setOpen(nav: HTMLElement, trigger: HTMLButtonElement, panel: HTMLElement, open: boolean): void {
  nav.classList.toggle("is-open", open);
  trigger.setAttribute("aria-expanded", open ? "true" : "false");
  trigger.setAttribute("aria-label", open ? "Close chapter menu" : "Open chapter menu");
  panel.hidden = !open;
  if (open) {
    const current = panel.querySelector<HTMLElement>("[aria-current='page']");
    current?.scrollIntoView({
      block: "nearest",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }
}

export function renderGuidebookChapterMenu(page: GuidebookPublicPage): HTMLElement {
  stopGuidebookChapterMenu();
  const current = catalogPageByPublicPage(page);
  const chapters = guidebookBookChapters();
  const trigger = el("button", {
    type: "button",
    id: TRIGGER_ID,
    class: "guidebook-chapter-trigger",
    "aria-expanded": "false",
    "aria-controls": PANEL_ID,
    "aria-label": "Open chapter menu",
  }, [menuIcon()]);
  const list = el("ol", { class: "guidebook-chapter-list" });
  for (const chapter of chapters) {
    const isCurrent = chapter.path === current?.path;
    const link = el("a", {
      href: chapter.path,
      class: "guidebook-chapter-link",
      ...(isCurrent ? { "aria-current": "page" } : {}),
    }, [
      el("span", { class: "guidebook-chapter-number" }, [chapter.number]),
      el("span", { class: "guidebook-chapter-title" }, [chapter.title]),
    ]);
    list.append(el("li", { class: "guidebook-chapter-item" }, [link]));
  }
  const panel = el("div", {
    id: PANEL_ID,
    class: "guidebook-chapter-panel",
    hidden: true,
  }, [list]);
  const nav = el("nav", {
    class: "guidebook-chapter-nav",
    "aria-label": "Book chapters",
  }, [panel, trigger]);

  menuAbort = new AbortController();
  const { signal } = menuAbort;

  const close = (restoreFocus = false) => {
    if (trigger.getAttribute("aria-expanded") !== "true") return;
    setOpen(nav, trigger, panel, false);
    if (restoreFocus) trigger.focus();
  };

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = trigger.getAttribute("aria-expanded") !== "true";
    setOpen(nav, trigger, panel, open);
  }, { signal });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close(true);
  }, { signal });

  document.addEventListener("pointerdown", (event) => {
    const target = event.target;
    if (!(target instanceof Node) || nav.contains(target)) return;
    close();
  }, { signal });

  return nav;
}
