import { isGoogleSyncConfigured } from "../sync/config.ts";
import { loadGoogleIdentityState } from "../sync/googleAuth.ts";
import { signInGoogleAccount, signOutGoogleAccount } from "../sync/syncEngine.ts";
import { readTheme, toggleTheme } from "../theme.ts";
import { statusBox } from "./bits.ts";
import { announce, el } from "./dom.ts";

let menuBound = false;
let globalListenersBound = false;
let open = false;
let focusReturn: HTMLElement | null = null;

export function resetSettingsMenuBinding(): void {
  menuBound = false;
  open = false;
  focusReturn = null;
}

export function isSettingsMenuOpen(): boolean {
  return open;
}

export function closeSettingsMenu(): void {
  const panel = document.getElementById("settings-menu-panel");
  const trigger = document.getElementById("settings-menu-trigger");
  if (!panel || !trigger) return;
  open = false;
  panel.hidden = true;
  trigger.setAttribute("aria-expanded", "false");
  if (focusReturn) {
    focusReturn.focus();
    focusReturn = null;
  }
}

function focusableIn(panel: HTMLElement): HTMLElement[] {
  return [...panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")].filter(
    (node) => !node.closest("[hidden]"),
  );
}

function themeToggleLabel(bedtime: boolean): string {
  return bedtime ? "Sun appearance (switch to light)" : "Moon appearance (switch to bedtime)";
}

function syncThemeToggleButton(): void {
  const bedtime = readTheme() === "bedtime";
  const btn = document.getElementById("settings-theme-toggle");
  if (!btn) return;
  btn.textContent = themeToggleLabel(bedtime);
  btn.setAttribute("aria-pressed", bedtime ? "true" : "false");
  btn.setAttribute(
    "aria-label",
    bedtime ? "Sun appearance — switch to light reading mode" : "Moon appearance — switch to bedtime reading mode",
  );
}

function ensureGlobalListeners(): void {
  if (globalListenersBound) return;
  globalListenersBound = true;
  document.addEventListener("keydown", (event) => {
    if (!open) return;
    const panel = document.getElementById("settings-menu-panel");
    const trigger = document.getElementById("settings-menu-trigger");
    if (!panel || !trigger) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeSettingsMenu();
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusableIn(panel);
    if (items.length === 0) return;
    const first = items[0]!;
    const last = items[items.length - 1]!;
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  });
  document.addEventListener("focusin", (event) => {
    if (!open) return;
    const panel = document.getElementById("settings-menu-panel");
    const trigger = document.getElementById("settings-menu-trigger");
    const target = event.target as Node;
    if (panel?.contains(target) || target === trigger) return;
    closeSettingsMenu();
  });
}

export function bindSettingsMenu(root: HTMLElement): void {
  ensureGlobalListeners();
  if (menuBound) return;
  const trigger = root.querySelector("#settings-menu-trigger") as HTMLButtonElement | null;
  const panel = root.querySelector("#settings-menu-panel") as HTMLElement | null;
  if (!trigger || !panel) return;
  menuBound = true;

  const identityHost = panel.querySelector("#settings-identity-host") as HTMLElement;
  const statusHost = panel.querySelector("#settings-status-host") as HTMLElement;

  const paintIdentity = async () => {
    const identity = await loadGoogleIdentityState();
    const configured = isGoogleSyncConfigured();
    identityHost.replaceChildren();
    if (identity.signedIn) {
      identityHost.append(
        el("p", { class: "meta settings-signed-in" }, [
          `Signed in as ${identity.email ?? "Google account"}`,
        ]),
        el("button", { type: "button", class: "settings-menu-item", id: "settings-sign-out" }, [
          "Sign out",
        ]),
      );
      identityHost.querySelector("#settings-sign-out")?.addEventListener("click", () => {
        void (async () => {
          await signOutGoogleAccount();
          statusHost.replaceChildren(
            statusBox("ok", "Signed out", "The guide and Astronomy Clock still work. Your saved progress on this device stays stored safely."),
          );
          await paintIdentity();
          announce("Signed out");
        })();
      });
      return;
    }
    const signIn = el("button", {
      type: "button",
      class: "settings-menu-item primary",
      id: "settings-sign-in",
    }, ["Sign in with Google"]);
    if (!configured) {
      signIn.disabled = true;
      identityHost.append(
        el("p", { class: "meta" }, ["Sign-in is not available on this copy of the site."]),
        signIn,
      );
      return;
    }
    identityHost.append(
      el("p", { class: "meta" }, [
        "Sign in for saved guide progress, Dream Journal, and Calendar reminders. Signing in does not turn on backup by itself.",
      ]),
      signIn,
    );
    signIn.addEventListener("click", () => {
      void (async () => {
        try {
          await signInGoogleAccount();
          statusHost.replaceChildren(
            statusBox("ok", "Signed in", "Drive backup and Calendar access are separate — you choose each when you need it."),
          );
          await paintIdentity();
        } catch {
          statusHost.replaceChildren(
            statusBox("error", "Sign-in did not finish", "You can keep reading the guide without signing in."),
          );
        }
      })();
    });
  };

  const openMenu = () => {
    focusReturn = document.activeElement instanceof HTMLElement ? document.activeElement : trigger;
    open = true;
    panel.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    void paintIdentity();
    syncThemeToggleButton();
    const items = focusableIn(panel);
    items[0]?.focus();
  };

  trigger.addEventListener("click", () => {
    if (open) closeSettingsMenu();
    else openMenu();
  });

  panel.querySelector("#settings-theme-toggle")?.addEventListener("click", () => {
    toggleTheme();
    syncThemeToggleButton();
    announce(readTheme() === "bedtime" ? "Bedtime mode" : "Light mode");
  });

  panel.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target.closest("a")) closeSettingsMenu();
  });
}

function gearIcon(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "settings-gear-icon");
  svg.setAttribute("width", "22");
  svg.setAttribute("height", "22");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8.94 4.55l-1.2-.98a7.2 7.2 0 0 0 0-2.14l1.2-.98a1 1 0 0 0 .23-1.39l-1.14-1.98a1 1 0 0 0-1.28-.44l-1.42.58a7.3 7.3 0 0 0-1.85-1.07l-.22-1.52A1 1 0 0 0 14.2 2h-2.4a1 1 0 0 0-.99.86l-.22 1.52c-.67.24-1.3.6-1.85 1.07l-1.42-.58a1 1 0 0 0-1.28.44L3.9 7.3a1 1 0 0 0 .23 1.39l1.2.98a7.2 7.2 0 0 0 0 2.14l-1.2.98a1 1 0 0 0-.23 1.39l1.14 1.98a1 1 0 0 0 1.28.44l1.42-.58c.55.47 1.18.83 1.85 1.07l.22 1.52c.08.52.5.9.99.9h2.4c.49 0 .91-.38.99-.86l.22-1.52a7.3 7.3 0 0 0 1.85-1.07l1.42.58a1 1 0 0 0 1.28-.44l1.14-1.98a1 1 0 0 0-.23-1.39Z",
  );
  path.setAttribute("fill", "currentColor");
  svg.append(path);
  return svg as SVGSVGElement;
}

export function settingsMenuPanel(): HTMLElement {
  const bedtime = readTheme() === "bedtime";
  return el("div", {
    id: "settings-menu-panel",
    class: "settings-menu-panel",
    role: "menu",
    "aria-labelledby": "settings-menu-trigger",
    hidden: true,
  }, [
    el("div", { id: "settings-identity-host", class: "settings-menu-section" }),
    el("div", { id: "settings-status-host", class: "settings-menu-section" }),
    el("nav", { class: "settings-menu-links", "aria-label": "Tools" }, [
      el("a", { href: "#/journal", class: "settings-menu-item", role: "menuitem" }, ["Dream Journal"]),
      el("a", { href: "#/astronomy", class: "settings-menu-item", role: "menuitem" }, ["Astronomy Clock"]),
      el("a", { href: "#/data", class: "settings-menu-item", role: "menuitem" }, ["Your data on this device"]),
      el("a", { href: "#/method", class: "settings-menu-item settings-menu-secondary", role: "menuitem" }, ["Method"]),
      el("a", { href: "#/about", class: "settings-menu-item settings-menu-secondary", role: "menuitem" }, ["About"]),
      el("a", { href: "#/account", class: "settings-menu-item settings-menu-secondary", role: "menuitem" }, [
        "Dream Journal backup",
      ]),
    ]),
    el("button", {
      type: "button",
      id: "settings-theme-toggle",
      class: "settings-menu-item",
      role: "menuitem",
      "aria-pressed": bedtime ? "true" : "false",
      "aria-label": bedtime
        ? "Sun appearance — switch to light reading mode"
        : "Moon appearance — switch to bedtime reading mode",
    }, [themeToggleLabel(bedtime)]),
  ]);
}

export function settingsMenuTrigger(): HTMLButtonElement {
  const button = el("button", {
    type: "button",
    id: "settings-menu-trigger",
    class: "settings-menu-trigger",
    "aria-haspopup": "menu",
    "aria-expanded": "false",
    "aria-controls": "settings-menu-panel",
    "aria-label": "Settings and tools",
  }, []);
  button.append(gearIcon());
  return button;
}
