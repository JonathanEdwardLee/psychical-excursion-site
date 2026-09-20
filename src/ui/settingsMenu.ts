import { isGoogleSyncConfigured } from "../sync/config.ts";
import { loadGoogleIdentityState } from "../sync/googleAuth.ts";
import { signInGoogleAccount, signOutGoogleAccount } from "../sync/syncEngine.ts";
import { readTheme, toggleTheme } from "../theme.ts";
import { statusBox } from "./bits.ts";
import { announce, el } from "./dom.ts";

let menuBound = false;

export function resetSettingsMenuBinding(): void {
  menuBound = false;
  open = false;
  focusReturn = null;
}
let open = false;
let focusReturn: HTMLElement | null = null;

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

export function bindSettingsMenu(root: HTMLElement): void {
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
            statusBox("ok", "Signed out", "The guide and Astronomy Clock still work. Your Dream Journal on this device is unchanged."),
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
        "Sign in for saved guide progress, Dream Journal backup, and Calendar reminders. Signing in does not turn on backup by itself.",
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
    const first = panel.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex="0"]',
    );
    first?.focus();
  };

  trigger.addEventListener("click", () => {
    if (open) closeSettingsMenu();
    else openMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeSettingsMenu();
    }
  });

  document.addEventListener("focusin", (event) => {
    if (!open || !panel.contains(event.target as Node) && event.target !== trigger) {
      if (open && !panel.contains(event.target as Node) && event.target !== trigger) {
        // allow focus to move outside only via Escape or trigger
      }
    }
  });

  panel.querySelector("#settings-theme-toggle")?.addEventListener("click", () => {
    const mode = toggleTheme();
    const bedtime = mode === "bedtime";
    const btn = panel.querySelector("#settings-theme-toggle") as HTMLButtonElement;
    btn.textContent = bedtime ? "Switch to light" : "Switch to bedtime mode";
    btn.setAttribute("aria-pressed", bedtime ? "true" : "false");
    const headerBtn = document.getElementById("theme-toggle-header");
    if (headerBtn) {
      headerBtn.textContent = bedtime ? "Light" : "Bedtime";
      headerBtn.setAttribute("aria-pressed", bedtime ? "true" : "false");
      headerBtn.setAttribute("aria-label", bedtime ? "Switch to light" : "Switch to bedtime mode");
    }
    announce(bedtime ? "Bedtime mode" : "Light mode");
  });

  panel.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target.closest("a")) closeSettingsMenu();
  });
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
    }, [bedtime ? "Switch to light" : "Switch to bedtime mode"]),
  ]);
}

export function settingsMenuTrigger(): HTMLButtonElement {
  return el("button", {
    type: "button",
    id: "settings-menu-trigger",
    class: "settings-menu-trigger",
    "aria-haspopup": "menu",
    "aria-expanded": "false",
    "aria-controls": "settings-menu-panel",
    "aria-label": "Settings and tools",
  }, ["Settings"]);
}
