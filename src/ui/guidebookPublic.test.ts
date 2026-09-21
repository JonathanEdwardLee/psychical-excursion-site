import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadGuidebookManuscript } from "../content/guidebookManuscript.ts";
import { renderApp } from "./app.ts";

async function mount(hash: string): Promise<HTMLElement> {
  window.location.hash = hash;
  document.body.innerHTML = '<div id="app"></div>';
  const root = document.getElementById("app")!;
  await renderApp(root);
  return root;
}

describe("guidebook public surface (PEX-GUIDEBOOK-HOME-014)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("loads the approved manuscript with the correct opening heading", () => {
    const manuscript = loadGuidebookManuscript();
    expect(manuscript.openingHeading).toBe("What Is a Psychical Excursion?");
    expect(manuscript.openingParagraphs[0]).toMatch(/What if consciousness/);
    expect(manuscript.references.length).toBeGreaterThanOrEqual(5);
  });

  it("renders the manuscript as the primary landing experience", async () => {
    const root = await mount("#/");
    expect(root.textContent).toMatch(/What Is a Psychical Excursion\?/);
    expect(root.textContent).toMatch(/An experiment in dreams, consciousness, energy, and out-of-body experience/);
    expect(root.textContent).toMatch(/Let's see what happens/);
    expect(root.textContent).not.toMatch(/Chapter 0/i);
    expect(root.textContent).not.toMatch(/Start Day 1/i);
    expect(root.textContent).not.toMatch(/Sign in with Google/i);
  });

  it("hides feature navigation and legacy routes from the public shell", async () => {
    for (const hash of ["#/", "#/days", "#/journal", "#/astronomy", "#/account", "#/today"]) {
      const root = await mount(hash);
      expect(root.querySelector("#settings-menu-trigger")).toBeNull();
      expect(root.querySelector(".nav-guide")).toBeNull();
      expect(root.querySelector('a[href="#/astronomy"]')).toBeNull();
      expect(root.textContent).toMatch(/What if consciousness/);
    }
  });

  it("exposes a plain Light/Dark switch and a compact sky widget", async () => {
    const root = await mount("#/");
    const theme = root.querySelector("#theme-light-dark") as HTMLButtonElement;
    expect(theme).toBeTruthy();
    expect(theme.textContent).toMatch(/Light|Dark/);
    expect(root.querySelector(".sky-widget-compact")).toBeTruthy();
    expect(root.querySelector(".sky-widget-compact a")).toBeNull();
  });

  it("does not request geolocation on load", async () => {
    const getCurrentPosition = vi.fn();
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: { getCurrentPosition },
    });
    await mount("#/");
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("toggles dark mode with ordinary Light/Dark labeling", async () => {
    const root = await mount("#/");
    const theme = root.querySelector("#theme-light-dark") as HTMLButtonElement;
    theme.click();
    expect(document.documentElement.dataset.theme).toBe("bedtime");
    expect(theme.textContent).toBe("Light");
    theme.click();
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(theme.textContent).toBe("Dark");
  });
});
