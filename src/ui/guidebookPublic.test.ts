import { beforeEach, describe, expect, it, vi } from "vitest";
import { CHAPTER_01_HASH, CHAPTER_01_TITLE, loadGuidebookChapter01 } from "../content/guidebookChapter01.ts";
import { CHAPTER_02_HASH, CHAPTER_02_TITLE, loadGuidebookChapter02 } from "../content/guidebookChapter02.ts";
import {
  CHAPTER_03_HASH,
  CHAPTER_03_PLACEHOLDER_MARKER,
  CHAPTER_03_TITLE,
  isGuidebookChapter03Ready,
} from "../content/guidebookChapter03.ts";
import { loadGuidebookManuscript } from "../content/guidebookManuscript.ts";
import { TROPICAL_ZODIAC_SIGNS } from "../astronomy/zodiac.ts";
import { renderApp } from "./app.ts";
import { resetGuidebookPageTracking } from "./guidebookRoute.ts";

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
    resetGuidebookPageTracking();
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

  it("hides feature navigation from the public shell", async () => {
    const root = await mount("#/");
    expect(root.querySelector("#settings-menu-trigger")).toBeNull();
    expect(root.querySelector(".nav-guide")).toBeNull();
    expect(root.querySelector('a[href="#/astronomy"]')).toBeNull();
    expect(root.querySelector(".guidebook-title")).toBeNull();
    expect(root.querySelector("header")?.textContent).not.toMatch(/Psychical Excursion/);
    expect(root.querySelector(".guidebook-footer")).toBeTruthy();
    expect(root.querySelector(".guidebook-footer .attribution")?.textContent).toMatch(/Website by/);
    expect(root.querySelector(".guidebook-footer .attribution")?.textContent).toMatch(/Hoopsnake Designs/);
  });

  it("normalizes retired hash routes to guidebook home", async () => {
    window.location.hash = "#/journal";
    document.body.innerHTML = '<div id="app"></div>';
    await renderApp(document.getElementById("app")!);
    expect(window.location.hash).toBe("#/");
  });

  it("normalizes retired hash routes without moving search into the hash", async () => {
    window.history.replaceState(null, "", "/index.html?foo=bar#/journal");
    document.body.innerHTML = '<div id="app"></div>';
    await renderApp(document.getElementById("app")!);
    expect(window.location.search).toBe("?foo=bar");
    expect(window.location.hash).toBe("#/");
  });

  it("links inline citations to reference anchors and DOI destinations", async () => {
    const root = await mount("#/");
    const citation = root.querySelector('a.guidebook-citation[href="#ref-2"]');
    expect(citation).toBeTruthy();
    expect(root.querySelector("#ref-2")).toBeTruthy();
    expect(root.querySelector("ol.guidebook-references")).toBeNull();
    const dois = [...root.querySelectorAll("a.guidebook-doi")] as HTMLAnchorElement[];
    expect(dois.length).toBeGreaterThanOrEqual(2);
    for (const link of dois) {
      expect(link.href).toMatch(/^https:\/\/doi\.org\/10\.\S+$/);
      expect(link.href.endsWith(".")).toBe(false);
    }
    const shambhala = root.querySelector("a.guidebook-external") as HTMLAnchorElement;
    expect(shambhala?.href).toBe(
      "https://www.shambhala.com/the-tibetan-yogas-of-dream-and-sleep.html",
    );
  });

  it("exposes an unlabeled theme switch and observational sky clock", async () => {
    const root = await mount("#/");
    const theme = root.querySelector("#theme-light-dark") as HTMLButtonElement;
    expect(theme).toBeTruthy();
    expect(theme.getAttribute("role")).toBe("switch");
    expect(theme.getAttribute("aria-label")).toMatch(/dark appearance/i);
    expect(theme.textContent?.replace(/\s+/g, "")).toBe("");
    const sky = root.querySelector(".sky-widget-compact") as HTMLElement;
    expect(sky).toBeTruthy();
    expect(sky.querySelector("a")).toBeNull();
    expect(sky.getAttribute("aria-label")).toMatch(/Sun in /);
    expect(sky.getAttribute("aria-label")).toMatch(/Moon in /);
    expect(sky.getAttribute("aria-label")).toMatch(/full moon/i);
    expect(sky.textContent).toContain("☉");
    expect(sky.textContent).toContain("☽");
    expect(TROPICAL_ZODIAC_SIGNS.some((sign) => sky.textContent?.includes(sign.glyph))).toBe(true);
    const sun = root.querySelector('.sky-widget-pair[data-sky-body="sun"]') as HTMLElement;
    const moon = root.querySelector('.sky-widget-pair[data-sky-body="moon"]') as HTMLElement;
    expect(sun.getAttribute("tabindex")).toBe("0");
    expect(moon.getAttribute("tabindex")).toBe("0");
    expect(sun.getAttribute("aria-label")).toMatch(/^Sun in /);
    expect(moon.getAttribute("aria-label")).toMatch(/^Moon in /);
    expect(sun.querySelector(".sky-widget-tip")?.textContent).toBe(sun.getAttribute("aria-label"));
    expect(moon.querySelector(".sky-widget-tip")?.textContent).toBe(moon.getAttribute("aria-label"));
    expect(sky.textContent).not.toMatch(/horoscope|rising|house|prediction/i);
    expect(sky.className).not.toMatch(/button|card/);
  });

  it("does not request geolocation on load", async () => {
    const getCurrentPosition = vi.fn();
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: { getCurrentPosition },
    });
    await mount("#/");
    await mount(CHAPTER_01_HASH);
    await mount(CHAPTER_02_HASH);
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("toggles dark mode through the switch state", async () => {
    const root = await mount("#/");
    const theme = root.querySelector("#theme-light-dark") as HTMLButtonElement;
    expect(theme.getAttribute("aria-checked")).toBe("false");
    theme.click();
    expect(document.documentElement.dataset.theme).toBe("bedtime");
    expect(theme.getAttribute("aria-checked")).toBe("true");
    theme.click();
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(theme.getAttribute("aria-checked")).toBe("false");
  });

  it("opens Chapter 1 from the editorial next-reading line", async () => {
    const root = await mount("#/");
    const next = root.querySelector("#guidebook-next-chapter") as HTMLAnchorElement;
    expect(next).toBeTruthy();
    expect(next.getAttribute("href")).toBe(CHAPTER_01_HASH);
    expect(next.textContent).toContain(CHAPTER_01_TITLE);
    expect(next.textContent).toContain("→");
    expect(root.querySelector(".nav-guide")).toBeNull();
    expect(root.querySelector('a[href="#/journal"]')).toBeNull();
    expect(root.querySelector('a[href="#/days"]')).toBeNull();
  });

  it("renders Chapter 1 as its own reading page without rewriting the title", async () => {
    const chapter = loadGuidebookChapter01();
    expect(chapter.title).toBe(CHAPTER_01_TITLE);
    const root = await mount(CHAPTER_01_HASH);
    expect(window.location.hash).toBe(CHAPTER_01_HASH);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_01_TITLE);
    expect(root.textContent).toMatch(/arousal-retrieval model/);
    expect(root.textContent).toMatch(/red stairs — grandmother — rain/);
    expect(root.querySelectorAll(".guidebook-steps").length).toBeGreaterThanOrEqual(2);
    expect(root.querySelector("#ref-6")).toBeTruthy();
    expect(root.querySelector(".pex-ambient-memory")).toBeTruthy();
    expect(root.querySelector("#guidebook-next-chapter-2")?.getAttribute("href")).toBe(CHAPTER_02_HASH);
    expect(root.querySelector("#guidebook-next-chapter-2")?.textContent).toContain(CHAPTER_02_TITLE);
    expect(root.querySelector('a[href="#/astronomy"]')).toBeNull();
    expect(root.textContent).not.toMatch(/Sign in with Google/);
    expect(document.title).toMatch(CHAPTER_01_TITLE);
  });

  it("keeps ambient geometry present for reduced-motion readers", async () => {
    const root = await mount("#/");
    expect(root.querySelector(".pex-ambient-orbit")).toBeTruthy();
    expect(root.querySelector(".guidebook-section.pex-reveal")).toBeTruthy();
  });

  it("renders Chapter 2 from the approved manuscript without a next-page link", async () => {
    const chapter = loadGuidebookChapter02();
    expect(chapter.title).toBe(CHAPTER_02_TITLE);
    const root = await mount(CHAPTER_02_HASH);
    expect(window.location.hash).toBe(CHAPTER_02_HASH);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_02_TITLE);
    expect(root.textContent).toMatch(/dream signs/);
    expect(root.textContent).toMatch(/Am I dreaming\?/);
    expect(root.querySelector("#guidebook-next-chapter-2")).toBeNull();
    expect(root.querySelector(".nav-guide")).toBeNull();
    expect(root.querySelector(".pex-ambient-notice")).toBeTruthy();
    expect(document.title).toMatch(CHAPTER_02_TITLE);
    expect(root.textContent).not.toMatch(/Sign in with Google/);
    expect(isGuidebookChapter03Ready()).toBe(false);
    expect(root.querySelector("#guidebook-next-chapter-3")).toBeNull();
    expect(root.textContent).not.toContain(CHAPTER_03_PLACEHOLDER_MARKER);
  });

  it("resets window scroll when moving between guidebook pages", async () => {
    const root = await mount("#/");
    document.documentElement.scrollTop = 480;
    window.location.hash = CHAPTER_01_HASH;
    await renderApp(root);
    expect(document.documentElement.scrollTop).toBe(0);
    document.documentElement.scrollTop = 320;
    window.location.hash = CHAPTER_02_HASH;
    await renderApp(root);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_02_TITLE);
  });

  it("does not publish Chapter 3 until the approved manuscript is supplied", async () => {
    const root = await mount(CHAPTER_03_HASH);
    expect(window.location.hash).toBe("#/");
    expect(root.querySelector("h1")?.textContent).toBe("What Is a Psychical Excursion?");
    expect(root.querySelector("h1")?.textContent).not.toBe(CHAPTER_03_TITLE);
    expect(root.textContent).not.toContain(CHAPTER_03_PLACEHOLDER_MARKER);
    expect(root.textContent).not.toMatch(/MILD|Wake-Back-to-Bed/i);
    expect(root.querySelector('a[href="#/journal"]')).toBeNull();
    expect(root.querySelector('a[href="#/days"]')).toBeNull();
    expect(root.querySelector('a[href="#/astronomy"]')).toBeNull();
  });

  it("resets scroll when the unfinished Chapter 3 hash is normalized to home", async () => {
    const root = await mount(CHAPTER_02_HASH);
    document.documentElement.scrollTop = 400;
    window.location.hash = CHAPTER_03_HASH;
    await renderApp(root);
    expect(window.location.hash).toBe("#/");
    expect(document.documentElement.scrollTop).toBe(0);
  });

  it("preserves Chapter 1 and Chapter 2 public routes", async () => {
    const one = await mount(CHAPTER_01_HASH);
    expect(one.querySelector("h1")?.textContent).toBe(CHAPTER_01_TITLE);
    const two = await mount(CHAPTER_02_HASH);
    expect(two.querySelector("h1")?.textContent).toBe(CHAPTER_02_TITLE);
  });
});
