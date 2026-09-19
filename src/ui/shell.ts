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
  { id: "account", href: "#/account", label: "Account" },
  { id: "astronomy", href: "#/astronomy", label: "Astronomy" },
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
      el("h1", { class: "visually-hidden" }, ["Psychical Excursion"]),
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
    themeToggle(),
  ]);
  if (moreCurrent) {
    header.querySelector(".nav-more")?.classList.add("is-open");
  }
  const live = el("div", { id: "live-status", class: "visually-hidden", "aria-live": "polite" });
  const main = el("main", { id: "main", class: "main-stage", tabindex: "-1" });
  const updateBanner = el("div", { id: "sw-banner" });
  const footer = el("footer", { class: "site-footer" }, [
    el("p", { class: "meta" }, ["Local practice guide. Journal entries stay on this device."]),
    el("p", { class: "attribution" }, [
      text("Website by "),
      el("a", { href: "https://hoopsnakedesigns.com/", rel: "noreferrer" }, ["Hoopsnake Designs"]),
    ]),
  ]);
  const frame = el("div", { class: "app-frame" }, [header, live, updateBanner, main, footer]);
  root.append(skip, frame);
  bindUpdateBanner(updateBanner);
  return { main };
}

function themeToggle(): HTMLButtonElement {
  const bedtime = readTheme() === "bedtime";
  const button = el("button", {
    type: "button",
    id: "theme-toggle-header",
    class: "quiet",
    "aria-pressed": bedtime ? "true" : "false",
    "aria-label": bedtime ? "Switch to light" : "Switch to bedtime mode",
  }, [bedtime ? "Light" : "Bedtime"]);
  button.addEventListener("click", () => {
    const mode = toggleTheme();
    const nowBedtime = mode === "bedtime";
    button.textContent = nowBedtime ? "Light" : "Bedtime";
    button.setAttribute("aria-pressed", nowBedtime ? "true" : "false");
    button.setAttribute("aria-label", nowBedtime ? "Switch to light" : "Switch to bedtime mode");
  });
  return button;
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
  PHASES.forEach((phase, index) => {
    nav.append(
      el(
        "a",
        {
          href: `#/phase/${phase.id}`,
          class: "phase-nav-link",
          ...(activeId === phase.id ? { "aria-current": "page" } : {}),
        },
        [
          el("span", { class: "phase-nav-index" }, [String(index + 1).padStart(2, "0")]),
          el("span", { class: "phase-nav-name" }, [phase.name]),
        ],
      ),
    );
  });
  return nav;
}
