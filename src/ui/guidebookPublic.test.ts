import { beforeEach, describe, expect, it, vi } from "vitest";
import { CHAPTER_01_HASH, CHAPTER_01_TITLE, loadGuidebookChapter01 } from "../content/guidebookChapter01.ts";
import { CHAPTER_02_HASH, CHAPTER_02_TITLE, loadGuidebookChapter02 } from "../content/guidebookChapter02.ts";
import {
  CHAPTER_03_HASH,
  CHAPTER_03_PLACEHOLDER_MARKER,
  CHAPTER_03_TITLE,
} from "../content/guidebookChapter03.ts";
import { CHAPTER_04_HASH, CHAPTER_04_TITLE, loadGuidebookChapter04 } from "../content/guidebookChapter04.ts";
import {
  CHAPTER_05_HASH,
  CHAPTER_05_PLACEHOLDER_MARKER,
  CHAPTER_05_TITLE,
  loadGuidebookChapter05,
} from "../content/guidebookChapter05.ts";
import { CHAPTER_06_HASH, CHAPTER_06_TITLE, loadGuidebookChapter06 } from "../content/guidebookChapter06.ts";
import { CHAPTER_07_HASH, CHAPTER_07_TITLE, loadGuidebookChapter07 } from "../content/guidebookChapter07.ts";
import { CHAPTER_08_HASH, CHAPTER_08_TITLE, loadGuidebookChapter08 } from "../content/guidebookChapter08.ts";
import { CHAPTER_09_HASH, CHAPTER_09_TITLE, loadGuidebookChapter09 } from "../content/guidebookChapter09.ts";
import { CHAPTER_10_HASH, CHAPTER_10_TITLE, loadGuidebookChapter10 } from "../content/guidebookChapter10.ts";
import { CHAPTER_11_HASH, CHAPTER_11_TITLE, loadGuidebookChapter11 } from "../content/guidebookChapter11.ts";
import { CHAPTER_12_HASH, CHAPTER_12_TITLE, loadGuidebookChapter12 } from "../content/guidebookChapter12.ts";
import { CHAPTER_13_HASH, CHAPTER_13_TITLE, loadGuidebookChapter13 } from "../content/guidebookChapter13.ts";
import { CHAPTER_14_HASH, CHAPTER_14_TITLE, loadGuidebookChapter14 } from "../content/guidebookChapter14.ts";
import { CHAPTER_15_HASH, CHAPTER_15_TITLE, loadGuidebookChapter15 } from "../content/guidebookChapter15.ts";
import { CHAPTER_16_HASH, CHAPTER_16_TITLE, loadGuidebookChapter16 } from "../content/guidebookChapter16.ts";
import { CHAPTER_17_HASH, CHAPTER_17_TITLE, loadGuidebookChapter17 } from "../content/guidebookChapter17.ts";
import { CHAPTER_18_HASH, CHAPTER_18_TITLE, loadGuidebookChapter18 } from "../content/guidebookChapter18.ts";
import { CHAPTER_19_HASH, CHAPTER_19_TITLE, loadGuidebookChapter19 } from "../content/guidebookChapter19.ts";
import { CHAPTER_20_HASH, CHAPTER_20_TITLE, loadGuidebookChapter20 } from "../content/guidebookChapter20.ts";
import { INTRODUCTION_PATH } from "../content/guidebookCatalog.ts";
import { NIGHTTIME_BODY_RELEASE_ID, RELAX_THE_BODY_HREF } from "../content/guidebookAnchors.ts";
import { loadGuidebookManuscript } from "../content/guidebookManuscript.ts";
import { TROPICAL_ZODIAC_SIGNS } from "../astronomy/zodiac.ts";
import { renderApp } from "./app.ts";
import { resetGa4PublicPageViews } from "../analytics/ga4.ts";
import { overrideGuidebookLocation, resetGuidebookPageTracking } from "./guidebookRoute.ts";

function setPublicRoute(route: string): void {
  if (route.startsWith("#")) {
    overrideGuidebookLocation("/", route);
    window.history.replaceState(null, "", "/");
    window.location.hash = route;
  } else {
    const url = new URL(route, "https://psychicalexcursion.com");
    overrideGuidebookLocation(url.pathname, url.hash);
    window.history.replaceState(null, "", url.pathname + url.hash);
  }
}

async function mount(route: string): Promise<HTMLElement> {
  setPublicRoute(route);
  document.body.innerHTML = '<div id="app"></div>';
  const root = document.getElementById("app")!;
  await renderApp(root);
  return root;
}

function practiceLabels(root: HTMLElement): string[] {
  const card = root.querySelector(".guidebook-practice");
  return [...card?.querySelectorAll(".guidebook-practice-label") ?? []].map((node) => node.textContent ?? "");
}

function expectHeldFeaturesAbsent(root: HTMLElement): void {
  expect(root.querySelector(".nav-guide")).toBeNull();
  expect(root.querySelector('a[href="#/journal"]')).toBeNull();
  expect(root.querySelector('a[href="#/days"]')).toBeNull();
  expect(root.querySelector('a[href="#/astronomy"]')).toBeNull();
  expect(root.textContent).not.toMatch(/Sign in with Google/);
}

function expectPublicHeader(root: HTMLElement): void {
  const header = root.querySelector("header.guidebook-header");
  expect(header).toBeTruthy();
  expect(header?.querySelector(".brand-logo-light")).toBeTruthy();
  expect(header?.querySelector(".brand-logo-reverse")).toBeTruthy();
  expect(header?.querySelector(".sky-widget-compact")).toBeTruthy();
  expect(header?.querySelector("#theme-light-dark")).toBeTruthy();
  expect(header?.querySelectorAll("img.brand-logo").length).toBe(2);
}

describe("guidebook public surface (PEX-GUIDEBOOK-HOME-014)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetGuidebookPageTracking();
    resetGa4PublicPageViews();
    window.gtag = vi.fn();
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

  it("migrates a legacy hash route to the canonical pathname before rendering", async () => {
    const root = await mount("#/stabilize-the-dream");
    expect(window.location.pathname).toBe(CHAPTER_14_HASH);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_14_TITLE);
    expect(root.textContent).not.toMatch(/Chapter\s+14/i);
  });

  it("normalizes retired hash routes to guidebook home", async () => {
    window.location.hash = "#/journal";
    document.body.innerHTML = '<div id="app"></div>';
    await renderApp(document.getElementById("app")!);
    expect(window.location.pathname).toBe(INTRODUCTION_PATH);
  });

  it("normalizes retired hash routes without moving search into the hash", async () => {
    window.history.replaceState(null, "", "/index.html?foo=bar#/journal");
    document.body.innerHTML = '<div id="app"></div>';
    await renderApp(document.getElementById("app")!);
    expect(window.location.search).toBe("?foo=bar");
    expect(window.location.pathname).toBe(INTRODUCTION_PATH);
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
    await mount(CHAPTER_03_HASH);
    await mount(CHAPTER_04_HASH);
    await mount(CHAPTER_20_HASH);
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
    expect(window.location.pathname).toBe(CHAPTER_01_HASH);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_01_TITLE);
    expect(root.textContent).toMatch(/arousal-retrieval model/);
    expect(root.textContent).toMatch(/red stairs — grandmother — rain/);
    expect(root.querySelectorAll("ol.guidebook-steps").length).toBeGreaterThanOrEqual(1);
    expect(practiceLabels(root)).toEqual(["Summary", "Experiment", "Intention"]);
    expect(root.querySelectorAll(".guidebook-practice").length).toBe(1);
    expect(root.querySelector("#ref-6")).toBeTruthy();
    expect(root.querySelector(".pex-ambient-memory")).toBeTruthy();
    expect(root.querySelector("#guidebook-prev-home")?.getAttribute("href")).toBe(INTRODUCTION_PATH);
    expect(root.querySelector("#guidebook-prev-home")?.textContent).toMatch(/Introduction/);
    expect(root.querySelector("#guidebook-next-chapter-2")?.getAttribute("href")).toBe(CHAPTER_02_HASH);
    expect(root.querySelector("#guidebook-next-chapter-2")?.textContent).toContain(CHAPTER_02_TITLE);
    expectPublicHeader(root);
    expectHeldFeaturesAbsent(root);
    expect(document.title).toMatch(CHAPTER_01_TITLE);
  });

  it("keeps ambient geometry present for reduced-motion readers", async () => {
    const root = await mount("#/");
    expect(root.querySelector(".pex-ambient-orbit")).toBeTruthy();
    expect(root.querySelector(".guidebook-section.pex-reveal")).toBeTruthy();
  });

  it("renders Chapter 2 from the approved manuscript with a Chapter 3 next-reading line", async () => {
    const chapter = loadGuidebookChapter02();
    expect(chapter.title).toBe(CHAPTER_02_TITLE);
    const root = await mount(CHAPTER_02_HASH);
    expect(window.location.pathname).toBe(CHAPTER_02_HASH);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_02_TITLE);
    expect(root.textContent).toMatch(/dream signs/);
    expect(root.textContent).toMatch(/Am I dreaming\?/);
    expect(root.querySelector("#guidebook-next-chapter-2")).toBeNull();
    expect(root.querySelector(".nav-guide")).toBeNull();
    expect(root.querySelector(".pex-ambient-notice")).toBeTruthy();
    expect(document.title).toMatch(CHAPTER_02_TITLE);
    expect(practiceLabels(root)).toEqual(["Summary", "Experiment", "Intention"]);
    expect(root.querySelectorAll(".guidebook-practice").length).toBe(1);
    expect(root.querySelector("#guidebook-prev-chapter-1")?.getAttribute("href")).toBe(CHAPTER_01_HASH);
    expect(root.querySelector("#guidebook-prev-chapter-1")?.textContent).toContain(CHAPTER_01_TITLE);
    expect(root.querySelector("#guidebook-next-chapter-3")?.getAttribute("href")).toBe(CHAPTER_03_HASH);
    expect(root.querySelector("#guidebook-next-chapter-3")?.textContent).toContain(CHAPTER_03_TITLE);
    expect(root.textContent).not.toContain(CHAPTER_03_PLACEHOLDER_MARKER);
    expectPublicHeader(root);
    expectHeldFeaturesAbsent(root);
  });

  it("resets window scroll when moving between guidebook pages", async () => {
    const root = await mount("#/");
    document.documentElement.scrollTop = 480;
    setPublicRoute(CHAPTER_01_HASH);
    await renderApp(root);
    expect(document.documentElement.scrollTop).toBe(0);
    document.documentElement.scrollTop = 320;
    setPublicRoute(CHAPTER_02_HASH);
    await renderApp(root);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_02_TITLE);
    document.documentElement.scrollTop = 280;
    setPublicRoute(CHAPTER_03_HASH);
    await renderApp(root);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_03_TITLE);
    document.documentElement.scrollTop = 240;
    setPublicRoute(CHAPTER_04_HASH);
    await renderApp(root);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_04_TITLE);
    document.documentElement.scrollTop = 200;
    setPublicRoute(CHAPTER_05_HASH);
    await renderApp(root);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_05_TITLE);
    document.documentElement.scrollTop = 180;
    setPublicRoute(CHAPTER_06_HASH);
    await renderApp(root);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_06_TITLE);
    document.documentElement.scrollTop = 160;
    setPublicRoute(CHAPTER_07_HASH);
    await renderApp(root);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_07_TITLE);
    document.documentElement.scrollTop = 140;
    setPublicRoute(CHAPTER_08_HASH);
    await renderApp(root);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_08_TITLE);
    document.documentElement.scrollTop = 120;
    setPublicRoute(CHAPTER_09_HASH);
    await renderApp(root);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_09_TITLE);
    document.documentElement.scrollTop = 100;
    setPublicRoute(CHAPTER_10_HASH);
    await renderApp(root);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_10_TITLE);
    document.documentElement.scrollTop = 80;
    setPublicRoute(CHAPTER_11_HASH);
    await renderApp(root);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_11_TITLE);
    document.documentElement.scrollTop = 60;
    setPublicRoute(CHAPTER_12_HASH);
    await renderApp(root);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_12_TITLE);
    document.documentElement.scrollTop = 40;
    setPublicRoute(CHAPTER_13_HASH);
    await renderApp(root);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_13_TITLE);
    document.documentElement.scrollTop = 20;
    setPublicRoute(CHAPTER_14_HASH);
    await renderApp(root);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_14_TITLE);
    document.documentElement.scrollTop = 10;
    setPublicRoute(CHAPTER_15_HASH);
    await renderApp(root);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_15_TITLE);
    document.documentElement.scrollTop = 10;
    setPublicRoute(CHAPTER_16_HASH);
    await renderApp(root);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_16_TITLE);
    document.documentElement.scrollTop = 10;
    setPublicRoute(CHAPTER_17_HASH);
    await renderApp(root);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_17_TITLE);
    document.documentElement.scrollTop = 10;
    setPublicRoute(CHAPTER_18_HASH);
    await renderApp(root);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_18_TITLE);
    document.documentElement.scrollTop = 10;
    setPublicRoute(CHAPTER_19_HASH);
    await renderApp(root);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_19_TITLE);
    document.documentElement.scrollTop = 10;
    setPublicRoute(CHAPTER_20_HASH);
    await renderApp(root);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_20_TITLE);
  });

  it("renders Chapter 3 with a Chapter 4 next-reading line and one practice card", async () => {
    const root = await mount(CHAPTER_03_HASH);
    expect(window.location.pathname).toBe(CHAPTER_03_HASH);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_03_TITLE);
    expect(root.textContent).toMatch(/Mnemonic Induction of Lucid Dreams/);
    expect(root.textContent).toMatch(/Wake-Back-to-Bed/);
    expect(root.querySelector("blockquote.guidebook-pull")?.textContent).toMatch(/DREAM MODE ENABLED/);
    expect(root.querySelector("ul.guidebook-steps")?.querySelectorAll("li").length).toBe(11);
    expect(root.querySelector("ol.guidebook-steps")).toBeNull();
    expect([...root.querySelectorAll("h2.guidebook-section-title")].map((node) => node.textContent)).not.toContain("Try This");
    expect(root.textContent?.split("Choose a dream you remember").length).toBe(2);
    expect(practiceLabels(root)).toEqual(["Summary", "Experiment", "Intention"]);
    expect(root.querySelectorAll(".guidebook-practice").length).toBe(1);
    expect(root.querySelector("#ref-1")).toBeTruthy();
    expect(root.querySelector("#ref-4")).toBeTruthy();
    expect(root.querySelector(".pex-ambient-recognize")).toBeTruthy();
    expect(root.querySelector("#guidebook-prev-chapter-2")?.getAttribute("href")).toBe(CHAPTER_02_HASH);
    expect(root.querySelector("#guidebook-next-chapter-4")?.getAttribute("href")).toBe(CHAPTER_04_HASH);
    expect(root.querySelector("#guidebook-next-chapter-4")?.textContent).toContain(CHAPTER_04_TITLE);
    expectPublicHeader(root);
    expectHeldFeaturesAbsent(root);
    expect(root.textContent).not.toContain(CHAPTER_03_PLACEHOLDER_MARKER);
    expect(document.title).toMatch(CHAPTER_03_TITLE);
  });

  it("renders Chapter 4 Feel the Body with a Chapter 5 next-reading line", async () => {
    const chapter = loadGuidebookChapter04();
    expect(chapter.title).toBe(CHAPTER_04_TITLE);
    const root = await mount(CHAPTER_04_HASH);
    expect(window.location.pathname).toBe(CHAPTER_04_HASH);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_04_TITLE);
    expect(root.textContent).toMatch(/progressive muscle relaxation/);
    expect(root.textContent).toMatch(/somatosensory attention/);
    expect(practiceLabels(root)).toEqual(["Summary", "Experiment", "Intention"]);
    expect(root.querySelectorAll(".guidebook-practice").length).toBe(1);
    expect(root.querySelector("#ref-1")).toBeTruthy();
    expect(root.querySelector("#ref-3")).toBeTruthy();
    expect(root.querySelector(".pex-ambient-body")).toBeTruthy();
    expect(root.querySelector("#guidebook-prev-chapter-3")?.getAttribute("href")).toBe(CHAPTER_03_HASH);
    expect(root.querySelector("#guidebook-prev-chapter-3")?.textContent).toContain(CHAPTER_03_TITLE);
    expect(root.querySelector(`#${NIGHTTIME_BODY_RELEASE_ID}`)?.textContent).toBe("A Nighttime Body Release");
    expect(root.querySelector("#guidebook-next-chapter-4")).toBeNull();
    expect(root.querySelector("#guidebook-next-chapter-5")?.getAttribute("href")).toBe(CHAPTER_05_HASH);
    expect(root.querySelector("#guidebook-next-chapter-5")?.textContent).toContain(CHAPTER_05_TITLE);
    expect(root.querySelector(".guidebook-footer")).toBeTruthy();
    expectPublicHeader(root);
    expectHeldFeaturesAbsent(root);
    expect(document.title).toMatch(CHAPTER_04_TITLE);
  });

  it("keeps reduced-motion readers able to see Chapter 4 sections", async () => {
    const root = await mount(CHAPTER_04_HASH);
    expect(root.querySelector(".pex-ambient-body")).toBeTruthy();
    expect(root.querySelector(".guidebook-section.pex-reveal")).toBeTruthy();
    expect(root.querySelector(".guidebook-practice")?.closest(".guidebook-section.pex-reveal")).toBeTruthy();
  });

  it("preserves Chapter 1 through Chapter 3 public routes", async () => {
    const one = await mount(CHAPTER_01_HASH);
    expect(one.querySelector("h1")?.textContent).toBe(CHAPTER_01_TITLE);
    expectPublicHeader(one);
    const two = await mount(CHAPTER_02_HASH);
    expect(two.querySelector("h1")?.textContent).toBe(CHAPTER_02_TITLE);
    const three = await mount(CHAPTER_03_HASH);
    expect(three.querySelector("h1")?.textContent).toBe(CHAPTER_03_TITLE);
  });

  it("renders Chapter 5 Move Your Attention with the attention instrument and a Chapter 6 next-reading line", async () => {
    const chapter = loadGuidebookChapter05();
    expect(chapter.title).toBe(CHAPTER_05_TITLE);
    const root = await mount(CHAPTER_05_HASH);
    expect(window.location.pathname).toBe(CHAPTER_05_HASH);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_05_TITLE);
    expect(root.querySelector(".pex-attention-instrument")).toBeTruthy();
    expect(root.textContent).toMatch(/Look at the center/);
    expect(root.textContent).toMatch(/tactile imaging/);
    expect(root.querySelectorAll("a.guidebook-pex-link").length).toBe(2);
    expect(root.querySelector("a.guidebook-pex-link")?.getAttribute("href")).toBe(RELAX_THE_BODY_HREF);
    expect(practiceLabels(root)).toEqual(["Summary", "Experiment", "Intention"]);
    expect(root.querySelectorAll(".guidebook-practice").length).toBe(1);
    expect(root.querySelector("#ref-1")).toBeTruthy();
    expect(root.querySelector("#ref-5")).toBeTruthy();
    expect(root.querySelector("#guidebook-prev-chapter-4")?.getAttribute("href")).toBe(CHAPTER_04_HASH);
    expect(root.querySelector("#guidebook-prev-chapter-4")?.textContent).toContain(CHAPTER_04_TITLE);
    expect(root.querySelector("#guidebook-next-chapter-5")).toBeNull();
    expect(root.querySelector("#guidebook-next-chapter-6")?.getAttribute("href")).toBe(CHAPTER_06_HASH);
    expect(root.querySelector("#guidebook-next-chapter-6")?.textContent).toContain(CHAPTER_06_TITLE);
    expectPublicHeader(root);
    expectHeldFeaturesAbsent(root);
    expect(root.textContent).not.toContain(CHAPTER_05_PLACEHOLDER_MARKER);
    expect(document.title).toMatch(CHAPTER_05_TITLE);
  });

  it("renders Chapter 6 Build the Current with a Chapter 7 next-reading line", async () => {
    const chapter = loadGuidebookChapter06();
    expect(chapter.title).toBe(CHAPTER_06_TITLE);
    const root = await mount(CHAPTER_06_HASH);
    expect(window.location.pathname).toBe(CHAPTER_06_HASH);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_06_TITLE);
    expect(root.querySelector(".pex-attention-instrument")).toBeNull();
    expect(root.textContent).toMatch(/From Movement to Current/);
    expect(root.textContent).toMatch(/a repeated, continuous movement of attention/);
    expect(root.querySelectorAll("a.guidebook-pex-link").length).toBe(2);
    expect(root.querySelector("a.guidebook-pex-link")?.getAttribute("href")).toBe(RELAX_THE_BODY_HREF);
    expect(practiceLabels(root)).toEqual(["Summary", "Experiment", "Intention"]);
    expect(root.querySelectorAll(".guidebook-practice").length).toBe(1);
    expect(root.querySelector("#ref-1")).toBeTruthy();
    expect(root.querySelector("#ref-4")).toBeTruthy();
    expect(root.querySelector("#guidebook-prev-chapter-5")?.getAttribute("href")).toBe(CHAPTER_05_HASH);
    expect(root.querySelector("#guidebook-prev-chapter-5")?.textContent).toContain(CHAPTER_05_TITLE);
    expect(root.querySelector("#guidebook-next-chapter-6")).toBeNull();
    expect(root.querySelector("#guidebook-next-chapter-7")?.getAttribute("href")).toBe(CHAPTER_07_HASH);
    expect(root.querySelector("#guidebook-next-chapter-7")?.textContent).toContain(CHAPTER_07_TITLE);
    expectPublicHeader(root);
    expectHeldFeaturesAbsent(root);
    expect(document.title).toMatch(CHAPTER_06_TITLE);
  });

  it("keeps reduced-motion readers able to see Chapter 6 sections", async () => {
    const root = await mount(CHAPTER_06_HASH);
    expect(root.querySelector(".guidebook-section.pex-reveal")).toBeTruthy();
    expect(root.querySelector(".guidebook-practice")?.closest(".guidebook-section.pex-reveal")).toBeTruthy();
  });

  it("renders Chapter 7 Quiet the Mind without a next-page link or attention instrument", async () => {
    const chapter = loadGuidebookChapter07();
    expect(chapter.title).toBe(CHAPTER_07_TITLE);
    const root = await mount(CHAPTER_07_HASH);
    expect(window.location.pathname).toBe(CHAPTER_07_HASH);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_07_TITLE);
    expect(root.querySelector(".pex-attention-instrument")).toBeNull();
    expect(root.textContent).toMatch(/meta-awareness/);
    expect(root.textContent).toMatch(/Focused-attention meditation/);
    const relaxLinks = [...root.querySelectorAll("a.guidebook-pex-link")];
    expect(relaxLinks).toHaveLength(1);
    expect(relaxLinks[0]?.getAttribute("href")).toBe(RELAX_THE_BODY_HREF);
    expect(relaxLinks[0]?.textContent).toBe("Relax the body");
    expect(practiceLabels(root)).toEqual(["Summary", "Experiment", "Intention"]);
    expect(root.querySelectorAll(".guidebook-practice").length).toBe(1);
    expect([...root.querySelectorAll("h2.guidebook-section-title")].map((node) => node.textContent)).not.toContain("Summary");
    expect(root.querySelector("#ref-1")).toBeTruthy();
    expect(root.querySelector("#ref-6")).toBeTruthy();
    expect(root.querySelector("#guidebook-prev-chapter-6")?.getAttribute("href")).toBe(CHAPTER_06_HASH);
    expect(root.querySelector("#guidebook-prev-chapter-6")?.textContent).toContain(CHAPTER_06_TITLE);
    expect(root.querySelector("#guidebook-next-chapter-7")).toBeNull();
    expect(root.querySelector("#guidebook-next-chapter-8")?.getAttribute("href")).toBe(CHAPTER_08_HASH);
    expect(root.querySelector("#guidebook-next-chapter-8")?.textContent).toContain(CHAPTER_08_TITLE);
    expectPublicHeader(root);
    expectHeldFeaturesAbsent(root);
    expect(root.textContent).not.toMatch(/\bPEx\b/);
    expect(document.title).toMatch(CHAPTER_07_TITLE);
  });

  it("keeps reduced-motion readers able to see Chapter 7 sections", async () => {
    const root = await mount(CHAPTER_07_HASH);
    expect(root.querySelector(".guidebook-section.pex-reveal")).toBeTruthy();
    expect(root.querySelector(".guidebook-practice")?.closest(".guidebook-section.pex-reveal")).toBeTruthy();
  });

  it("renders Chapter 8 See the Image with a Chapter 9 next-reading line", async () => {
    const chapter = loadGuidebookChapter08();
    expect(chapter.title).toBe(CHAPTER_08_TITLE);
    const root = await mount(CHAPTER_08_HASH);
    expect(window.location.pathname).toBe(CHAPTER_08_HASH);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_08_TITLE);
    expect(root.querySelector(".pex-attention-instrument")).toBeNull();
    expect(root.textContent).toMatch(/Close your eyes and picture a basketball/);
    expect(root.textContent).toMatch(/object imagery/);
    expect([...root.querySelectorAll("h3.guidebook-practice-subheading")].map((node) => node.textContent)).toEqual([
      "Part One — Construct",
      "Part Two — Receive",
    ]);
    expect(practiceLabels(root)).toEqual(["Summary", "Experiment", "Intention"]);
    expect(root.querySelectorAll(".guidebook-practice").length).toBe(1);
    expect(root.querySelector("#ref-1")).toBeTruthy();
    expect(root.querySelector("#ref-9")).toBeTruthy();
    expect(root.querySelector("#guidebook-prev-chapter-7")?.getAttribute("href")).toBe(CHAPTER_07_HASH);
    expect(root.querySelector("#guidebook-prev-chapter-7")?.textContent).toContain(CHAPTER_07_TITLE);
    expect(root.querySelector("#guidebook-next-chapter-8")).toBeNull();
    expect(root.querySelector("#guidebook-next-chapter-9")?.getAttribute("href")).toBe(CHAPTER_09_HASH);
    expect(root.querySelector("#guidebook-next-chapter-9")?.textContent).toContain(CHAPTER_09_TITLE);
    expectPublicHeader(root);
    expectHeldFeaturesAbsent(root);
    expect(root.textContent).not.toMatch(/\bPEx\b/);
    expect(document.title).toMatch(CHAPTER_08_TITLE);
  });

  it("keeps reduced-motion readers able to see Chapter 8 sections", async () => {
    const root = await mount(CHAPTER_08_HASH);
    expect(root.querySelector(".guidebook-section.pex-reveal")).toBeTruthy();
    expect(root.querySelector(".guidebook-practice")?.closest(".guidebook-section.pex-reveal")).toBeTruthy();
  });

  it("renders Chapter 9 Watch the Edge with a Chapter 10 next-reading line", async () => {
    const chapter = loadGuidebookChapter09();
    expect(chapter.title).toBe(CHAPTER_09_TITLE);
    const root = await mount(CHAPTER_09_HASH);
    expect(window.location.pathname).toBe(CHAPTER_09_HASH);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_09_TITLE);
    expect(root.querySelector(".pex-attention-instrument")).toBeNull();
    expect(root.textContent).toMatch(/Falling Asleep Is a Process/);
    expect(root.textContent).toMatch(/microdreams/);
    const relaxLinks = [...root.querySelectorAll("a.guidebook-pex-link")];
    expect(relaxLinks).toHaveLength(1);
    expect(relaxLinks[0]?.getAttribute("href")).toBe(RELAX_THE_BODY_HREF);
    expect(relaxLinks[0]?.textContent).toBe("Relax the body");
    expect(practiceLabels(root)).toEqual(["Summary", "Experiment", "Intention"]);
    expect(root.querySelectorAll(".guidebook-practice").length).toBe(1);
    expect(root.querySelector("#ref-1")).toBeTruthy();
    expect(root.querySelector("#ref-14")).toBeTruthy();
    expect(root.querySelector("#guidebook-prev-chapter-8")?.getAttribute("href")).toBe(CHAPTER_08_HASH);
    expect(root.querySelector("#guidebook-prev-chapter-8")?.textContent).toContain(CHAPTER_08_TITLE);
    expect(root.querySelector("#guidebook-next-chapter-9")).toBeNull();
    expect(root.querySelector("#guidebook-next-chapter-10")?.getAttribute("href")).toBe(CHAPTER_10_HASH);
    expect(root.querySelector("#guidebook-next-chapter-10")?.textContent).toContain(CHAPTER_10_TITLE);
    expectPublicHeader(root);
    expectHeldFeaturesAbsent(root);
    expect(root.textContent).not.toMatch(/\bPEx\b/);
    expect(document.title).toMatch(CHAPTER_09_TITLE);
  });

  it("keeps reduced-motion readers able to see Chapter 9 sections", async () => {
    const root = await mount(CHAPTER_09_HASH);
    expect(root.querySelector(".guidebook-section.pex-reveal")).toBeTruthy();
    expect(root.querySelector(".guidebook-practice")?.closest(".guidebook-section.pex-reveal")).toBeTruthy();
  });

  it("renders Chapter 10 Let the Body Sleep with a Chapter 11 next-reading line", async () => {
    const chapter = loadGuidebookChapter10();
    expect(chapter.title).toBe(CHAPTER_10_TITLE);
    const root = await mount(CHAPTER_10_HASH);
    expect(window.location.pathname).toBe(CHAPTER_10_HASH);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_10_TITLE);
    expect(root.querySelector(".pex-attention-instrument")).toBeNull();
    expect(root.textContent).toMatch(/mind awake, body asleep/);
    expect(root.textContent).toMatch(/Movement and Awareness Are Not One System/);
    const relaxLinks = [...root.querySelectorAll("a.guidebook-pex-link")];
    expect(relaxLinks).toHaveLength(1);
    expect(relaxLinks[0]?.getAttribute("href")).toBe(RELAX_THE_BODY_HREF);
    expect(relaxLinks[0]?.textContent).toBe("Relax the body");
    expect(practiceLabels(root)).toEqual(["Summary", "Experiment", "Intention"]);
    expect(root.querySelectorAll(".guidebook-practice").length).toBe(1);
    expect(root.querySelector("#ref-1")).toBeTruthy();
    expect(root.querySelector("#ref-13")).toBeTruthy();
    expect(root.querySelector("#guidebook-prev-chapter-9")?.getAttribute("href")).toBe(CHAPTER_09_HASH);
    expect(root.querySelector("#guidebook-prev-chapter-9")?.textContent).toContain(CHAPTER_09_TITLE);
    expect(root.querySelector("#guidebook-next-chapter-10")).toBeNull();
    expect(root.querySelector("#guidebook-next-chapter-11")?.getAttribute("href")).toBe(CHAPTER_11_HASH);
    expect(root.querySelector("#guidebook-next-chapter-11")?.textContent).toContain(CHAPTER_11_TITLE);
    expectPublicHeader(root);
    expectHeldFeaturesAbsent(root);
    expect(root.textContent).not.toMatch(/\bPEx\b/);
    expect(document.title).toMatch(CHAPTER_10_TITLE);
  });

  it("keeps reduced-motion readers able to see Chapter 10 sections", async () => {
    const root = await mount(CHAPTER_10_HASH);
    expect(root.querySelector(".guidebook-section.pex-reveal")).toBeTruthy();
    expect(root.querySelector(".guidebook-practice")?.closest(".guidebook-section.pex-reveal")).toBeTruthy();
  });

  it("renders Chapter 11 Move Without Moving with a Chapter 12 next-reading line", async () => {
    const chapter = loadGuidebookChapter11();
    expect(chapter.title).toBe(CHAPTER_11_TITLE);
    const root = await mount(CHAPTER_11_HASH);
    expect(window.location.pathname).toBe(CHAPTER_11_HASH);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_11_TITLE);
    expect(root.querySelector(".pex-attention-instrument")).toBeNull();
    expect(root.textContent).toMatch(/Raise one hand/);
    expect([...root.querySelectorAll("h3.guidebook-practice-subheading")].map((node) => node.textContent)).toEqual([
      "Part One — Move, Then Remember",
      "Part Two — Move the Whole Body Without Moving",
      "Part Three — Stop Directing",
    ]);
    expect(practiceLabels(root)).toEqual(["Summary", "Experiment", "Intention"]);
    expect(root.querySelectorAll(".guidebook-practice").length).toBe(1);
    expect(root.querySelector("#ref-1")).toBeTruthy();
    expect(root.querySelector("#ref-5")).toBeTruthy();
    expect(root.querySelector("#guidebook-prev-chapter-10")?.getAttribute("href")).toBe(CHAPTER_10_HASH);
    expect(root.querySelector("#guidebook-prev-chapter-10")?.textContent).toContain(CHAPTER_10_TITLE);
    expect(root.querySelector("#guidebook-next-chapter-11")).toBeNull();
    expect(root.querySelector("#guidebook-next-chapter-12")?.getAttribute("href")).toBe(CHAPTER_12_HASH);
    expect(root.querySelector("#guidebook-next-chapter-12")?.textContent).toContain(CHAPTER_12_TITLE);
    expectPublicHeader(root);
    expectHeldFeaturesAbsent(root);
    expect(root.textContent).not.toMatch(/\bPEx\b/);
    expect(document.title).toMatch(CHAPTER_11_TITLE);
  });

  it("keeps reduced-motion readers able to see Chapter 11 sections", async () => {
    const root = await mount(CHAPTER_11_HASH);
    expect(root.querySelector(".guidebook-section.pex-reveal")).toBeTruthy();
    expect(root.querySelector(".guidebook-practice")?.closest(".guidebook-section.pex-reveal")).toBeTruthy();
  });

  it("renders Chapter 12 Feel the Shift with a Chapter 13 next-reading line", async () => {
    const chapter = loadGuidebookChapter12();
    expect(chapter.title).toBe(CHAPTER_12_TITLE);
    const root = await mount(CHAPTER_12_HASH);
    expect(window.location.pathname).toBe(CHAPTER_12_HASH);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_12_TITLE);
    expect(root.querySelector(".pex-attention-instrument")).toBeNull();
    expect(root.textContent).toMatch(/Which part of the bodily self shifts first/);
    expect(root.textContent).toMatch(/Body sensation/);
    expect(root.textContent).toMatch(/Self-location/);
    expect(root.textContent).toMatch(/Body ownership/);
    expect(root.textContent).toMatch(/Environment/);
    expect([...root.querySelectorAll("h3.guidebook-practice-subheading")].map((node) => node.textContent)).toEqual([
      "Map the Shift",
    ]);
    expect(practiceLabels(root)).toEqual(["Summary", "Experiment", "Intention"]);
    expect(root.querySelectorAll(".guidebook-practice").length).toBe(1);
    expect(root.querySelector("#ref-1")).toBeTruthy();
    expect(root.querySelector("#ref-7")).toBeTruthy();
    expect(root.querySelector("#guidebook-prev-chapter-11")?.getAttribute("href")).toBe(CHAPTER_11_HASH);
    expect(root.querySelector("#guidebook-prev-chapter-11")?.textContent).toContain(CHAPTER_11_TITLE);
    expect(root.querySelector("#guidebook-next-chapter-12")).toBeNull();
    expect(root.querySelector("#guidebook-next-chapter-13")?.getAttribute("href")).toBe(CHAPTER_13_HASH);
    expect(root.querySelector("#guidebook-next-chapter-13")?.textContent).toContain(CHAPTER_13_TITLE);
    expectPublicHeader(root);
    expectHeldFeaturesAbsent(root);
    expect(root.textContent).not.toMatch(/\bPEx\b/);
    expect(document.title).toMatch(CHAPTER_12_TITLE);
  });

  it("keeps reduced-motion readers able to see Chapter 12 sections", async () => {
    const root = await mount(CHAPTER_12_HASH);
    expect(root.querySelector(".guidebook-section.pex-reveal")).toBeTruthy();
    expect(root.querySelector(".guidebook-practice")?.closest(".guidebook-section.pex-reveal")).toBeTruthy();
  });

  it("renders Chapter 13 Know the Threshold with a Chapter 14 next-reading line", async () => {
    const chapter = loadGuidebookChapter13();
    expect(chapter.title).toBe(CHAPTER_13_TITLE);
    const root = await mount(CHAPTER_13_HASH);
    expect(window.location.pathname).toBe(CHAPTER_13_HASH);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_13_TITLE);
    expect(root.querySelector(".pex-attention-instrument")).toBeNull();
    expect(root.textContent).toMatch(/At some point every night, you fall asleep/);
    expect([...root.querySelectorAll("h3.guidebook-practice-subheading")].map((node) => node.textContent)).toEqual([
      "Catch the Crossing",
      "The outside",
      "The inside",
      "The observer",
    ]);
    expect(practiceLabels(root)).toEqual(["Summary", "Experiment", "Intention"]);
    expect(root.querySelectorAll(".guidebook-practice").length).toBe(1);
    expect(root.querySelector("#ref-1")).toBeTruthy();
    expect(root.querySelector("#ref-8")).toBeTruthy();
    expect(root.querySelector("#guidebook-prev-chapter-12")?.getAttribute("href")).toBe(CHAPTER_12_HASH);
    expect(root.querySelector("#guidebook-prev-chapter-12")?.textContent).toContain(CHAPTER_12_TITLE);
    expect(root.querySelector("#guidebook-next-chapter-13")).toBeNull();
    expect(root.querySelector("#guidebook-next-chapter-14")?.getAttribute("href")).toBe(CHAPTER_14_HASH);
    expect(root.querySelector("#guidebook-next-chapter-14")?.textContent).toContain(CHAPTER_14_TITLE);
    expectPublicHeader(root);
    expectHeldFeaturesAbsent(root);
    expect(root.textContent).not.toMatch(/\bPEx\b/);
    expect(root.textContent).not.toMatch(/you are in N1|this is REM|this proves lucid REM/i);
    expect(document.title).toMatch(CHAPTER_13_TITLE);
  });

  it("keeps reduced-motion readers able to see Chapter 13 sections", async () => {
    const root = await mount(CHAPTER_13_HASH);
    expect(root.querySelector(".guidebook-section.pex-reveal")).toBeTruthy();
    expect(root.querySelector(".guidebook-practice")?.closest(".guidebook-section.pex-reveal")).toBeTruthy();
  });

  it("renders Chapter 14 Stabilize the Dream with a Chapter 15 next-reading line", async () => {
    const chapter = loadGuidebookChapter14();
    expect(chapter.title).toBe(CHAPTER_14_TITLE);
    const root = await mount(CHAPTER_14_HASH);
    expect(window.location.pathname).toBe(CHAPTER_14_HASH);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_14_TITLE);
    expect(root.querySelector(".pex-attention-instrument")).toBeNull();
    expect(root.textContent).toMatch(/Becoming lucid can feel like the finish line/);
    expect([...root.querySelectorAll("h3.guidebook-practice-subheading")].map((node) => node.textContent)).toEqual([
      "Stay in the Scene",
      "Touch",
      "Look",
      "Move",
      "Speak",
      "No intervention",
    ]);
    expect(practiceLabels(root)).toEqual(["Summary", "Experiment", "Intention"]);
    expect(root.querySelectorAll(".guidebook-practice").length).toBe(1);
    expect(root.querySelector("#ref-1")).toBeTruthy();
    expect(root.querySelector("#ref-9")).toBeTruthy();
    expect(root.querySelector("#guidebook-prev-chapter-13")?.getAttribute("href")).toBe(CHAPTER_13_HASH);
    expect(root.querySelector("#guidebook-prev-chapter-13")?.textContent).toContain(CHAPTER_13_TITLE);
    expect(root.querySelector("#guidebook-next-chapter-14")).toBeNull();
    expect(root.querySelector("#guidebook-next-chapter-15")?.getAttribute("href")).toBe(CHAPTER_15_HASH);
    expect(root.querySelector("#guidebook-next-chapter-15")?.textContent).toContain(CHAPTER_15_TITLE);
    expectPublicHeader(root);
    expectHeldFeaturesAbsent(root);
    expect(root.textContent).not.toMatch(/\bPEx\b/);
    expect(root.textContent).not.toMatch(/guaranteed to stabilize|always prevents fading/i);
    expect(document.title).toMatch(CHAPTER_14_TITLE);
  });

  it("keeps reduced-motion readers able to see Chapter 14 sections", async () => {
    const root = await mount(CHAPTER_14_HASH);
    expect(root.querySelector(".guidebook-section.pex-reveal")).toBeTruthy();
    expect(root.querySelector(".guidebook-practice")?.closest(".guidebook-section.pex-reveal")).toBeTruthy();
  });

  it("renders Chapter 15 Explore the Dream with a Chapter 16 next-reading line", async () => {
    const chapter = loadGuidebookChapter15();
    expect(chapter.title).toBe(CHAPTER_15_TITLE);
    const root = await mount(CHAPTER_15_HASH);
    expect(window.location.pathname).toBe(CHAPTER_15_HASH);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_15_TITLE);
    expect(root.querySelector(".pex-attention-instrument")).toBeNull();
    expect(root.textContent).toMatch(/Once a lucid dream becomes stable enough to stay inside/);
    expect([...root.querySelectorAll("h3.guidebook-practice-subheading")].map((node) => node.textContent)).toEqual([
      "One Question",
      "Observe first",
      "Ask",
      "Separate surprise from interpretation",
      "Check memory",
      "External verification",
      "Problem exploration",
    ]);
    expect(practiceLabels(root)).toEqual(["Summary", "Experiment", "Intention"]);
    expect(root.querySelectorAll(".guidebook-practice").length).toBe(1);
    expect(root.querySelector("#ref-1")).toBeTruthy();
    expect(root.querySelector("#ref-10")).toBeTruthy();
    expect(root.querySelector("#guidebook-prev-chapter-14")?.getAttribute("href")).toBe(CHAPTER_14_HASH);
    expect(root.querySelector("#guidebook-prev-chapter-14")?.textContent).toContain(CHAPTER_14_TITLE);
    expect(root.querySelector("#guidebook-next-chapter-15")).toBeNull();
    expect(root.querySelector("#guidebook-next-chapter-16")?.getAttribute("href")).toBe(CHAPTER_16_HASH);
    expect(root.querySelector("#guidebook-next-chapter-16")?.textContent).toContain(CHAPTER_16_TITLE);
    expectPublicHeader(root);
    expectHeldFeaturesAbsent(root);
    expect(root.textContent).not.toMatch(/\bPEx\b/);
    expect(root.textContent).not.toMatch(/dream characters are independent consciousness|dream answers are external facts/i);
    expect(document.title).toMatch(CHAPTER_15_TITLE);
  });

  it("keeps reduced-motion readers able to see Chapter 15 sections", async () => {
    const root = await mount(CHAPTER_15_HASH);
    expect(root.querySelector(".guidebook-section.pex-reveal")).toBeTruthy();
    expect(root.querySelector(".guidebook-practice")?.closest(".guidebook-section.pex-reveal")).toBeTruthy();
  });

  it("renders Chapter 16 Loosen the Body with a Chapter 17 next-reading line", async () => {
    const chapter = loadGuidebookChapter16();
    expect(chapter.title).toBe(CHAPTER_16_TITLE);
    const root = await mount(CHAPTER_16_HASH);
    expect(window.location.pathname).toBe(CHAPTER_16_HASH);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_16_TITLE);
    expect(root.querySelector(".pex-attention-instrument")).toBeNull();
    expect(root.textContent).toMatch(/Most of the time, being located inside your body/);
    expect([...root.querySelectorAll("h3.guidebook-practice-subheading")].map((node) => node.textContent)).toEqual([
      "Loosen the Map",
      "Ownership",
      "Location",
      "Perspective",
      "Movement",
      "Compare the components",
    ]);
    expect(practiceLabels(root)).toEqual(["Summary", "Experiment", "Intention"]);
    expect(root.querySelectorAll(".guidebook-practice").length).toBe(1);
    expect(root.querySelector("#ref-1")).toBeTruthy();
    expect(root.querySelector("#ref-10")).toBeTruthy();
    expect(root.querySelector("#guidebook-prev-chapter-15")?.getAttribute("href")).toBe(CHAPTER_15_HASH);
    expect(root.querySelector("#guidebook-prev-chapter-15")?.textContent).toContain(CHAPTER_15_TITLE);
    expect(root.querySelector("#guidebook-next-chapter-16")).toBeNull();
    expect(root.querySelector("#guidebook-next-chapter-17")?.getAttribute("href")).toBe(CHAPTER_17_HASH);
    expect(root.querySelector("#guidebook-next-chapter-17")?.textContent).toContain(CHAPTER_17_TITLE);
    expectPublicHeader(root);
    expectHeldFeaturesAbsent(root);
    expect(root.textContent).not.toMatch(/\bPEx\b/);
    expect(root.textContent).not.toMatch(/Chapter\s+16/i);
    expect(root.textContent).not.toMatch(/proves consciousness left the body|literal separation is proven/i);
    expect(document.title).toMatch(CHAPTER_16_TITLE);
  });

  it("keeps reduced-motion readers able to see Chapter 16 sections", async () => {
    const root = await mount(CHAPTER_16_HASH);
    expect(root.querySelector(".guidebook-section.pex-reveal")).toBeTruthy();
    expect(root.querySelector(".guidebook-practice")?.closest(".guidebook-section.pex-reveal")).toBeTruthy();
  });

  it("renders Chapter 17 Cross the Threshold with a Chapter 18 next-reading line", async () => {
    const chapter = loadGuidebookChapter17();
    expect(chapter.title).toBe(CHAPTER_17_TITLE);
    const root = await mount(CHAPTER_17_HASH);
    expect(window.location.pathname).toBe(CHAPTER_17_HASH);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_17_TITLE);
    expect(root.querySelector(".pex-attention-instrument")).toBeNull();
    expect(root.textContent).toMatch(/If you search for astral projection techniques/);
    expect([...root.querySelectorAll("h3.guidebook-practice-subheading")].map((node) => node.textContent)).toEqual([
      "Choose One Door",
      "Lucid route",
      "Imagined movement route",
      "Sleep-edge route",
      "MILD / SSILD route",
      "Natural sleep-paralysis route",
      "Record the crossing",
    ]);
    expect(practiceLabels(root)).toEqual(["Summary", "Experiment", "Intention"]);
    expect(root.querySelectorAll(".guidebook-practice").length).toBe(1);
    expect(root.querySelector("#ref-1")).toBeTruthy();
    expect(root.querySelector("#ref-11")).toBeTruthy();
    expect(root.querySelector("#guidebook-prev-chapter-16")?.getAttribute("href")).toBe(CHAPTER_16_HASH);
    expect(root.querySelector("#guidebook-prev-chapter-16")?.textContent).toContain(CHAPTER_16_TITLE);
    expect(root.querySelector("#guidebook-next-chapter-17")).toBeNull();
    expect(root.querySelector("#guidebook-next-chapter-18")?.getAttribute("href")).toBe(CHAPTER_18_HASH);
    expect(root.querySelector("#guidebook-next-chapter-18")?.textContent).toContain(CHAPTER_18_TITLE);
    expectPublicHeader(root);
    expectHeldFeaturesAbsent(root);
    expect(root.textContent).not.toMatch(/\bPEx\b/);
    expect(root.textContent).not.toMatch(/Chapter\s+17/i);
    expect(root.textContent).not.toMatch(/literal astral separation is scientifically established/i);
    expect(document.title).toMatch(CHAPTER_17_TITLE);
  });

  it("keeps reduced-motion readers able to see Chapter 17 sections", async () => {
    const root = await mount(CHAPTER_17_HASH);
    expect(root.querySelector(".guidebook-section.pex-reveal")).toBeTruthy();
    expect(root.querySelector(".guidebook-practice")?.closest(".guidebook-section.pex-reveal")).toBeTruthy();
  });

  it("renders Chapter 18 Test the Experience with a Chapter 19 next-reading line", async () => {
    const chapter = loadGuidebookChapter18();
    expect(chapter.title).toBe(CHAPTER_18_TITLE);
    const root = await mount(CHAPTER_18_HASH);
    expect(window.location.pathname).toBe(CHAPTER_18_HASH);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_18_TITLE);
    expect(root.querySelector(".pex-attention-instrument")).toBeNull();
    expect(root.textContent).toMatch(/Some experiences are convincing before they are verified/);
    expect([...root.querySelectorAll("h3.guidebook-practice-subheading")].map((node) => node.textContent)).toEqual([
      "Make It Falsifiable",
      "Write the rule first",
      "Hide the answer",
      "Record before checking",
      "Reveal",
      "Keep the denominator",
      "Repeat",
    ]);
    expect(practiceLabels(root)).toEqual(["Summary", "Experiment", "Intention"]);
    expect(root.querySelectorAll(".guidebook-practice").length).toBe(1);
    expect(root.querySelector("#ref-1")).toBeTruthy();
    expect(root.querySelector("#ref-5")).toBeTruthy();
    expect(root.querySelector("#guidebook-prev-chapter-17")?.getAttribute("href")).toBe(CHAPTER_17_HASH);
    expect(root.querySelector("#guidebook-prev-chapter-17")?.textContent).toContain(CHAPTER_17_TITLE);
    expect(root.querySelector("#guidebook-next-chapter-18")).toBeNull();
    expect(root.querySelector("#guidebook-next-chapter-19")?.getAttribute("href")).toBe(CHAPTER_19_HASH);
    expect(root.querySelector("#guidebook-next-chapter-19")?.textContent).toContain(CHAPTER_19_TITLE);
    expectPublicHeader(root);
    expectHeldFeaturesAbsent(root);
    expect(root.textContent).not.toMatch(/\bPEx\b/);
    expect(root.textContent).not.toMatch(/Chapter\s+18/i);
    expect(root.textContent).toMatch(/AWARE proved consciousness leaves the body/);
    expect(root.textContent).toMatch(/AWARE disproved every OBE claim/);
    expect(document.title).toMatch(CHAPTER_18_TITLE);
  });

  it("keeps reduced-motion readers able to see Chapter 18 sections", async () => {
    const root = await mount(CHAPTER_18_HASH);
    expect(root.querySelector(".guidebook-section.pex-reveal")).toBeTruthy();
    expect(root.querySelector(".guidebook-practice")?.closest(".guidebook-section.pex-reveal")).toBeTruthy();
  });

  it("renders Chapter 19 Compare the Maps with a Chapter 20 next-reading line", async () => {
    const chapter = loadGuidebookChapter19();
    expect(chapter.title).toBe(CHAPTER_19_TITLE);
    const root = await mount(CHAPTER_19_HASH);
    expect(window.location.pathname).toBe(CHAPTER_19_HASH);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_19_TITLE);
    expect(root.querySelector(".pex-attention-instrument")).toBeNull();
    expect(root.textContent).toMatch(/By this point, the same night can acquire several names/);
    expect([...root.querySelectorAll("h3.guidebook-practice-subheading")].map((node) => node.textContent)).toEqual([
      "Map One Experience Five Ways",
      "Lucid-dream map",
      "Sleep-paralysis map",
      "OBE map",
      "Astral-projection map",
      "Verification map",
      "Compare",
    ]);
    expect(practiceLabels(root)).toEqual(["Summary", "Experiment", "Intention"]);
    expect(root.querySelectorAll(".guidebook-practice").length).toBe(1);
    expect(root.querySelector("#ref-1")).toBeTruthy();
    expect(root.querySelector("#ref-9")).toBeTruthy();
    expect(root.querySelector("#guidebook-prev-chapter-18")?.getAttribute("href")).toBe(CHAPTER_18_HASH);
    expect(root.querySelector("#guidebook-prev-chapter-18")?.textContent).toContain(CHAPTER_18_TITLE);
    expect(root.querySelector("#guidebook-next-chapter-19")).toBeNull();
    expect(root.querySelector("#guidebook-next-chapter-20")?.getAttribute("href")).toBe(CHAPTER_20_HASH);
    expect(root.querySelector("#guidebook-next-chapter-20")?.textContent).toContain(CHAPTER_20_TITLE);
    expectPublicHeader(root);
    expectHeldFeaturesAbsent(root);
    expect(root.textContent).not.toMatch(/\bPEx\b/);
    expect(root.textContent).not.toMatch(/Chapter\s+19/i);
    expect(root.textContent).not.toMatch(/scientifically established literal travel/i);
    expect(document.title).toMatch(CHAPTER_19_TITLE);
  });

  it("keeps reduced-motion readers able to see Chapter 19 sections", async () => {
    const root = await mount(CHAPTER_19_HASH);
    expect(root.querySelector(".guidebook-section.pex-reveal")).toBeTruthy();
    expect(root.querySelector(".guidebook-practice")?.closest(".guidebook-section.pex-reveal")).toBeTruthy();
  });

  it("renders Chapter 20 Watch the Sky without a next-page link, location request, or attention instrument", async () => {
    const chapter = loadGuidebookChapter20();
    expect(chapter.title).toBe(CHAPTER_20_TITLE);
    const root = await mount(CHAPTER_20_HASH);
    expect(window.location.pathname).toBe(CHAPTER_20_HASH);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_20_TITLE);
    expect(root.querySelector(".pex-attention-instrument")).toBeNull();
    expect(root.querySelector(".sky-widget-compact")).toBeTruthy();
    expect(root.querySelector(".sky-widget-compact")?.textContent).not.toMatch(/horoscope|rising|house|prediction/i);
    expect(root.textContent).toMatch(/Human beings slept under the sky long before we invented blackout curtains/);
    expect([...root.querySelectorAll("h3.guidebook-practice-subheading")].map((node) => node.textContent)).toEqual([
      "Track the Sky Without Cheating",
      "Record the night first",
      "Add the Sun",
      "Add the Moon",
      "Add solar or geomagnetic conditions only later",
      "Add one planetary claim",
      "Read the Sky Clock historically",
      "Travel somewhere impossible",
      "Compare",
    ]);
    expect(practiceLabels(root)).toEqual(["Summary", "Experiment", "Intention"]);
    expect(root.querySelectorAll(".guidebook-practice").length).toBe(1);
    expect(root.querySelector("#ref-1")).toBeTruthy();
    expect(root.querySelector("#ref-13")).toBeTruthy();
    expect(root.querySelector("#ref-27")).toBeTruthy();
    expect(root.querySelector("#guidebook-prev-chapter-19")?.getAttribute("href")).toBe(CHAPTER_19_HASH);
    expect(root.querySelector("#guidebook-prev-chapter-19")?.textContent).toContain(CHAPTER_19_TITLE);
    expect(root.querySelector("#guidebook-next-chapter-20")).toBeNull();
    expect(root.querySelector("#guidebook-next-chapter-21")).toBeNull();
    expectPublicHeader(root);
    expectHeldFeaturesAbsent(root);
    expect(root.textContent).not.toMatch(/\bPEx\b/);
    expect(root.textContent).not.toMatch(/Chapter\s+20/i);
    expect(root.textContent).not.toMatch(/astrology is scientifically validated/i);
    expect(root.textContent).not.toMatch(/lunar sleep effects are settled/i);
    expect(root.textContent).toMatch(/tropical/);
    expect(root.textContent).toMatch(/Virgo|Spica/);
    expect(document.title).toMatch(CHAPTER_20_TITLE);
  });

  it("keeps reduced-motion readers able to see Chapter 20 sections", async () => {
    const root = await mount(CHAPTER_20_HASH);
    expect(root.querySelector(".guidebook-section.pex-reveal")).toBeTruthy();
    expect(root.querySelector(".guidebook-practice")?.closest(".guidebook-section.pex-reveal")).toBeTruthy();
  });

  it("records GA4 page views for public hash routes without duplicates or private content", async () => {
    const gtag = window.gtag as ReturnType<typeof vi.fn>;
    await mount("#/");
    await mount("#/");
    await mount(CHAPTER_12_HASH);
    await mount(CHAPTER_13_HASH);
    await mount(CHAPTER_14_HASH);
    await mount(CHAPTER_15_HASH);
    await mount(CHAPTER_16_HASH);
    await mount(CHAPTER_17_HASH);
    await mount(CHAPTER_18_HASH);
    await mount(CHAPTER_19_HASH);
    await mount(CHAPTER_20_HASH);
    await mount(RELAX_THE_BODY_HREF);
    const views = gtag.mock.calls.filter((call) => call[0] === "event" && call[1] === "page_view");
    expect(views).toHaveLength(11);
    expect(views.map((call) => (call[2] as { page_path: string }).page_path)).toEqual([
      INTRODUCTION_PATH,
      CHAPTER_12_HASH,
      CHAPTER_13_HASH,
      CHAPTER_14_HASH,
      CHAPTER_15_HASH,
      CHAPTER_16_HASH,
      CHAPTER_17_HASH,
      CHAPTER_18_HASH,
      CHAPTER_19_HASH,
      CHAPTER_20_HASH,
      CHAPTER_04_HASH,
    ]);
    expect(JSON.stringify(views)).not.toMatch(/555962302|15841198465/);
    expect(JSON.stringify(views)).not.toMatch(/journal note|dream text|fixture/i);
  });

  it("opens a Chapter 4 relaxation deep link at A Nighttime Body Release", async () => {
    const root = await mount(RELAX_THE_BODY_HREF);
    expect(window.location.pathname + window.location.hash).toBe(RELAX_THE_BODY_HREF);
    const heading = root.querySelector(`#${NIGHTTIME_BODY_RELEASE_ID}`);
    expect(heading?.textContent).toBe("A Nighttime Body Release");
    expect(heading?.closest(".guidebook-section")?.classList.contains("is-visible")).toBe(true);
    expect(root.querySelector("h1")?.textContent).toBe(CHAPTER_04_TITLE);
  });
});
