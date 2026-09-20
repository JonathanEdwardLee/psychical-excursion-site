import { beforeEach, describe, expect, it } from "vitest";
import { renderApp } from "./app.ts";
import { localStore } from "../db/store.ts";
import { DB_NAME } from "../domain/types.ts";
import { closeSettingsMenu, isSettingsMenuOpen } from "./settingsMenu.ts";
import { calendarAffirmationPanel } from "./calendarAffirmation.ts";
import { fixtureSignIn, fixtureSignOut } from "./testFixtures.ts";

async function resetLocalDatabase(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("could not reset indexeddb"));
    request.onblocked = () => resolve();
  });
}

async function mount(hash: string): Promise<HTMLElement> {
  window.location.hash = hash;
  document.body.innerHTML = '<div id="app"></div>';
  const root = document.getElementById("app")!;
  await renderApp(root);
  return root;
}

const BLOCKED_PUBLIC = /\b(PEx Primary|Night [Cc]apture|Capture to Journal|Account & backup)\b/;

describe("PEX-D076 public information architecture", () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    await resetLocalDatabase();
    await fixtureSignOut();
    closeSettingsMenu();
  });

  it("keeps the full guide readable signed out without progress UI", async () => {
    await localStore.completeDay(2);
    const day = await mount("#/day/30");
    expect(day.textContent).toMatch(/Do this/);
    expect(day.querySelector("#complete-day")).toBeNull();
    expect(day.querySelector("#journal-signed-out")).toBeTruthy();
    const days = await mount("#/days");
    expect(days.querySelectorAll(".day-row")).toHaveLength(60);
    expect(days.querySelector("#days-progress-summary")).toBeNull();
    const home = await mount("#/");
    expect(home.querySelector("#home-progress-copy")).toBeNull();
    expect(home.textContent).not.toMatch(/marked complete on this device/i);
  });

  it("shows saved progress only when signed in", async () => {
    await localStore.completeDay(3);
    await fixtureSignIn();
    const home = await mount("#/");
    expect(home.querySelector("#home-progress-copy")?.textContent).toMatch(/1 of 60/);
    const day = await mount("#/day/3");
    expect(day.querySelector("#undo-day")).toBeTruthy();
  });

  it("puts Start Day 1 first on home for new visitors", async () => {
    const home = await mount("#/");
    expect(home.querySelector("#home-start-day")?.textContent).toMatch(/Start Day 1/);
    expect(home.querySelector("#home-start-day")?.getAttribute("href")).toBe("#/day/1");
    expect(home.querySelector("#home-promise")?.textContent).toMatch(/free 60-day guide/i);
    expect(home.querySelector("#home-see-path")).toBeTruthy();
  });

  it("avoids retired participant-facing labels in primary surfaces", async () => {
    for (const hash of ["#/", "#/today", "#/day/1", "#/journal", "#/astronomy", "#/days"]) {
      const root = await mount(hash);
      expect(root.textContent ?? "").not.toMatch(BLOCKED_PUBLIC);
      expect(root.querySelector('.nav-guide a[href="#/account"]')).toBeNull();
      expect(root.querySelector("#settings-menu-trigger")).toBeTruthy();
      expect(root.querySelector("#theme-toggle-header")).toBeNull();
    }
  });

  it("uses a gear control for Settings and tools", async () => {
    const root = await mount("#/");
    const trigger = root.querySelector("#settings-menu-trigger") as HTMLButtonElement;
    expect(trigger.getAttribute("aria-label")).toMatch(/Settings and tools/i);
    expect(trigger.querySelector(".settings-gear-icon")).toBeTruthy();
    expect(trigger.textContent?.trim()).toBe("");
  });

  it("opens settings with keyboard, traps focus on Tab, and closes with Escape", async () => {
    const root = await mount("#/");
    const trigger = root.querySelector("#settings-menu-trigger") as HTMLButtonElement;
    trigger.focus();
    trigger.click();
    expect(isSettingsMenuOpen()).toBe(true);
    const panel = root.querySelector("#settings-menu-panel") as HTMLElement;
    expect(panel.hidden).toBe(false);
    const theme = panel.querySelector("#settings-theme-toggle") as HTMLButtonElement;
    theme.focus();
    theme.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(panel.contains(document.activeElement)).toBe(true);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(isSettingsMenuOpen()).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("closes the menu when focus leaves the panel", async () => {
    const root = await mount("#/");
    const trigger = root.querySelector("#settings-menu-trigger") as HTMLButtonElement;
    trigger.click();
    const outside = root.querySelector(".brand-link") as HTMLAnchorElement;
    outside.focus();
    expect(isSettingsMenuOpen()).toBe(false);
  });

  it("shows signed-out Dream Journal gate without browse/create", async () => {
    await localStore.saveCapture({
      id: "legacy-dream",
      type: "dream",
      note: "legacy-local-dream",
      createdAt: Date.now(),
      audio: null,
    });
    const journal = await mount("#/journal");
    expect(journal.querySelector("#journal-signed-out")).toBeTruthy();
    expect(journal.querySelector("#journal-new-dream")).toBeNull();
    expect(journal.textContent).not.toMatch(/legacy-local-dream/);
    expect(journal.textContent).not.toMatch(/OAuth|IndexedDB|drive\.file/i);
  });

  it("restores local dream entries after sign-in", async () => {
    await localStore.saveCapture({
      id: "legacy-dream-2",
      type: "dream",
      note: "restored-after-sign-in",
      createdAt: Date.now(),
      audio: null,
    });
    await fixtureSignIn();
    const journal = await mount("#/journal");
    expect(journal.textContent).toMatch(/restored-after-sign-in/);
    expect(journal.querySelector("#journal-new-dream")).toBeTruthy();
  });

  it("builds calendar review UI only after explicit open — no auto bulk create", () => {
    const panel = calendarAffirmationPanel(1);
    expect(panel?.querySelector("#calendar-affirmation-open")).toBeTruthy();
    expect(panel?.querySelector("#calendar-affirmation-confirm")).toBeNull();
  });
});
