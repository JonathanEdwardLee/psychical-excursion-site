import { snapshotAt } from "../astronomy/clock.ts";
import { allWeekNumbers, weekLabel } from "../content/weeks.ts";
import { applyTheme, readTheme, toggleTheme } from "../theme.ts";
import { el, text } from "./dom.ts";
import type { AppRoute } from "./routes.ts";
import { routeNavKey } from "./routes.ts";
import {
  bindSettingsMenu,
  resetSettingsMenuBinding,
  settingsMenuPanel,
  settingsMenuTrigger,
} from "./settingsMenu.ts";

const GUIDE_ITEMS = [
  { id: "today", href: "#/today", label: "Today" },
  { id: "days", href: "#/days", label: "Days" },
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

function footerSkyClock(): HTMLElement {
  const snap = snapshotAt(new Date(), null);
  const link = el("a", { href: "#/astronomy", class: "footer-sky-clock" }, [
    `${snap.moon.phaseName} · ${snap.localTimeLabel}`,
  ]);
  return el("p", { class: "meta footer-clock-row" }, [text("Sky clock · "), link]);
}

export function renderChrome(
  root: HTMLElement,
  route: AppRoute,
): { main: HTMLElement } {
  applyTheme();
  root.replaceChildren();
  const current = routeNavKey(route);
  const skip = el("a", { class: "skip-link", href: "#main" }, ["Skip to content"]);
  const toolsWrap = el("div", { class: "header-tools" }, [
    themeToggle(),
    settingsMenuTrigger(),
    settingsMenuPanel(),
  ]);
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
    el("nav", { class: "nav-guide", "aria-label": "Guide" }, [
      ...GUIDE_ITEMS.map((item) =>
        navAnchor(
          item.href,
          item.label,
          item.id === "today" ? route.name === "today" : item.id === current && route.name !== "today",
        ),
      ),
    ]),
    toolsWrap,
  ]);
  const live = el("div", { id: "live-status", class: "visually-hidden", "aria-live": "polite" });
  const main = el("main", { id: "main", class: "main-stage", tabindex: "-1" });
  const updateBanner = el("div", { id: "sw-banner" });
  const footer = el("footer", { class: "site-footer" }, [
    el("p", { class: "meta" }, [
      "Free 60-day guide. Dream Journal stays on this device until you choose backup or export.",
    ]),
    footerSkyClock(),
    el("p", { class: "attribution" }, [
      text("Website by "),
      el("a", { href: "https://hoopsnakedesigns.com/", rel: "noreferrer" }, ["Hoopsnake Designs"]),
    ]),
  ]);
  const frame = el("div", { class: "app-frame" }, [header, live, updateBanner, main, footer]);
  root.append(skip, frame);
  bindUpdateBanner(updateBanner);
  resetSettingsMenuBinding();
  bindSettingsMenu(root);
  return { main };
}

function themeToggle(): HTMLButtonElement {
  const bedtime = readTheme() === "bedtime";
  const button = el("button", {
    type: "button",
    id: "theme-toggle-header",
    class: "quiet theme-toggle-header",
    "aria-pressed": bedtime ? "true" : "false",
    "aria-label": bedtime ? "Switch to light" : "Switch to bedtime mode",
  }, [bedtime ? "Light" : "Bedtime"]);
  button.addEventListener("click", () => {
    const mode = toggleTheme();
    const nowBedtime = mode === "bedtime";
    button.textContent = nowBedtime ? "Light" : "Bedtime";
    button.setAttribute("aria-pressed", nowBedtime ? "true" : "false");
    button.setAttribute("aria-label", nowBedtime ? "Switch to light" : "Switch to bedtime mode");
    const settingsBtn = document.getElementById("settings-theme-toggle");
    if (settingsBtn) {
      settingsBtn.textContent = nowBedtime ? "Switch to light" : "Switch to bedtime mode";
      settingsBtn.setAttribute("aria-pressed", nowBedtime ? "true" : "false");
    }
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
            "A newer application shell is waiting. Reload to use it. Your Dream Journal on this device is not stored in the app cache.",
          ],
        ),
      ]),
      button,
    );
  });
}

export function weekNav(activeWeek?: number): HTMLElement {
  const nav = el("nav", { class: "phase-nav week-nav", "aria-label": "Weeks" });
  for (const week of allWeekNumbers()) {
    nav.append(
      el(
        "a",
        {
          href: `#/week/${week}`,
          class: "phase-nav-link week-nav-link",
          ...(activeWeek === week ? { "aria-current": "page" } : {}),
        },
        [el("span", { class: "phase-nav-name" }, [weekLabel(week)])],
      ),
    );
  }
  return nav;
}

/** @deprecated Use weekNav — phase IDs remain for legacy URLs only. */
export function phaseNav(activeWeek?: number): HTMLElement {
  return weekNav(activeWeek);
}
