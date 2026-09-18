import { packetStatus } from "../content/load.ts";
import { PHASES } from "../content/phases.ts";
import { applyTheme, readTheme, toggleTheme } from "../theme.ts";
import { el, text } from "./dom.ts";
import type { AppRoute } from "./routes.ts";
import { routeNavKey } from "./routes.ts";

const PRIMARY_ITEMS = [
  { id: "today", href: "#/today", label: "Today" },
  { id: "capture", href: "#/capture", label: "Capture" },
  { id: "journal", href: "#/journal", label: "Journal" },
  { id: "days", href: "#/days", label: "Days" },
] as const;

const MORE_ITEMS = [
  { id: "method", href: "#/method", label: "Method" },
  { id: "about", href: "#/about", label: "About" },
  { id: "data", href: "#/data", label: "Data" },
] as const;

function navAnchor(
  href: string,
  label: string,
  current: boolean,
  extraClass = "",
): HTMLAnchorElement {
  return el(
    "a",
    { href, class: extraClass, ...(current ? { "aria-current": "page" } : {}) },
    [label],
  );
}

export function renderChrome(
  root: HTMLElement,
  route: AppRoute,
): { main: HTMLElement } {
  applyTheme();
  root.replaceChildren();
  const current = routeNavKey(route);
  const skip = el("a", { class: "skip-link", href: "#main" }, ["Skip to content"]);
  const moreCurrent = MORE_ITEMS.some((item) => item.id === current);
  const header = el("header", { class: "app-header" }, [
    el("div", { class: "brand-row" }, [
      el("a", { href: "#/", class: "brand-link" }, [
        el("p", { class: "mark" }, ["PEx"]),
        el("h1", {}, ["Psychical Excursion"]),
      ]),
      themeToggle(),
    ]),
    el("nav", { class: "nav-primary", "aria-label": "Primary" }, [
      ...PRIMARY_ITEMS.map((item) =>
        navAnchor(
          item.href,
          item.label,
          item.id === "today" ? route.name === "today" : item.id === current && route.name !== "today",
        ),
      ),
    ]),
    el("nav", { class: "nav-more", "aria-label": "More" }, [
      ...MORE_ITEMS.map((item) => navAnchor(item.href, item.label, item.id === current)),
    ]),
  ]);
  if (moreCurrent) {
    header.querySelector(".nav-more")?.classList.add("is-open");
  }
  const live = el("div", { id: "live-status", class: "visually-hidden", "aria-live": "polite" });
  const main = el("main", { id: "main", tabindex: "-1" });
  const updateBanner = el("div", { id: "sw-banner" });
  const footer = el("footer", { class: "site-footer" }, [
    fixtureNotice(),
    el("p", { class: "attribution" }, [
      text("Website by "),
      el("a", { href: "https://hoopsnakedesigns.com/", rel: "noreferrer" }, ["Hoopsnake Designs"]),
    ]),
  ]);
  root.append(skip, header, live, updateBanner, main, footer);
  bindUpdateBanner(updateBanner);
  return { main };
}

function themeToggle(): HTMLButtonElement {
  const button = el("button", { type: "button", id: "theme-toggle-header", class: "quiet" }, [
    readTheme() === "bedtime" ? "Warm light" : "Bedtime",
  ]);
  button.addEventListener("click", () => {
    const mode = toggleTheme();
    button.textContent = mode === "bedtime" ? "Warm light" : "Bedtime";
  });
  return button;
}

function fixtureNotice(): HTMLElement {
  const status = packetStatus();
  if (status.readyForAcceptance) {
    return el("p", { class: "meta" }, ["Local practice guide. Journal entries stay on this device."]);
  }
  return el("p", { class: "fixture-banner", role: "status" }, [
    "DEVELOPMENT FIXTURE CONTENT is in use. The locked Days 1–60 packet has not been integrated. This notice must not remain when requesting Complete Product acceptance.",
  ]);
}

let updateBannerBound = false;

function bindUpdateBanner(host: HTMLElement): void {
  if (updateBannerBound) return;
  updateBannerBound = true;
  document.addEventListener("pex-sw-update", () => {
    const target = document.getElementById("sw-banner") ?? host;
    const button = el("button", { type: "button" }, ["Reload for update"]);
    button.addEventListener("click", () => window.location.reload());
    target.replaceChildren(
      el("div", { class: "status status-info", role: "status" }, [
        el("p", { class: "status-title" }, ["App update ready"]),
        el(
          "p",
          {},
          [
            "A newer application shell is waiting. Reload to use it. Journal data in IndexedDB is not in the service worker cache.",
          ],
        ),
      ]),
      button,
    );
  });
}

export function phaseNav(activeId?: string): HTMLElement {
  const nav = el("nav", { class: "phase-nav", "aria-label": "Phases" });
  for (const phase of PHASES) {
    nav.append(
      el(
        "a",
        {
          href: `#/phase/${phase.id}`,
          ...(activeId === phase.id ? { "aria-current": "page" } : {}),
        },
        [phase.name],
      ),
    );
  }
  return nav;
}
