import { beforeEach, describe, expect, it } from "vitest";
import { renderApp } from "./app.ts";
import { DB_NAME } from "../domain/types.ts";
import { closeSettingsMenu, isSettingsMenuOpen } from "./settingsMenu.ts";
import { calendarAffirmationPanel } from "./calendarAffirmation.ts";

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
    closeSettingsMenu();
  });

  it("keeps the full guide readable signed out", async () => {
    const day = await mount("#/day/30");
    expect(day.textContent).toMatch(/Do this/);
    expect(day.querySelector("#complete-day")).toBeTruthy();
    const days = await mount("#/days");
    expect(days.querySelectorAll(".day-row")).toHaveLength(60);
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
    }
  });

  it("opens settings with keyboard and closes with Escape", async () => {
    const root = await mount("#/");
    const trigger = root.querySelector("#settings-menu-trigger") as HTMLButtonElement;
    trigger.focus();
    trigger.click();
    expect(isSettingsMenuOpen()).toBe(true);
    expect((root.querySelector("#settings-menu-panel") as HTMLElement).hidden).toBe(false);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(isSettingsMenuOpen()).toBe(false);
  });

  it("invites sign-in on signed-out Dream Journal without OAuth jargon", async () => {
    const journal = await mount("#/journal");
    expect(journal.querySelector("#journal-signed-out")).toBeTruthy();
    expect(journal.textContent).toMatch(/Sign in with Google/i);
    expect(journal.textContent).not.toMatch(/OAuth|IndexedDB|drive\.file/i);
  });

  it("builds calendar review UI only after explicit open — no auto bulk create", () => {
    const panel = calendarAffirmationPanel(1);
    expect(panel?.querySelector("#calendar-affirmation-open")).toBeTruthy();
    expect(panel?.querySelector("#calendar-affirmation-confirm")).toBeNull();
  });
});
