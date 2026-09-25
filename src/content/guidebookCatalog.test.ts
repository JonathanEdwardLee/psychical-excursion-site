import { describe, expect, it } from "vitest";
import {
  GUIDEBOOK_CATALOG_PAGES,
  GUIDEBOOK_SITE_ORIGIN,
  INTRODUCTION_PATH,
  resolveLegacyGuidebookHash,
} from "./guidebookCatalog.ts";

describe("guidebook SEO catalog", () => {
  it("publishes 17 unique canonical paths without chapter numbers", () => {
    expect(GUIDEBOOK_CATALOG_PAGES).toHaveLength(17);
    const paths = GUIDEBOOK_CATALOG_PAGES.map((page) => page.path);
    expect(new Set(paths).size).toBe(17);
    for (const page of GUIDEBOOK_CATALOG_PAGES) {
      expect(page.path.startsWith("/")).toBe(true);
      expect(page.path.endsWith("/")).toBe(true);
      expect(page.path).not.toMatch(/chapter/i);
      expect(page.title).not.toMatch(/chapter\s+\d/i);
      expect(page.path).not.toMatch(/#/);
    }
    expect(INTRODUCTION_PATH).toBe("/psychical-excursion/");
    expect(GUIDEBOOK_SITE_ORIGIN).toBe("https://psychicalexcursion.com");
  });

  it("maps legacy hashes including the body-scan deep link", () => {
    expect(resolveLegacyGuidebookHash("#/stabilize-the-dream")?.path).toBe("/lucid-dream-stabilization/");
    expect(resolveLegacyGuidebookHash("#/feel-the-shift")?.path).toBe("/out-of-body-sensations-sleep/");
    expect(resolveLegacyGuidebookHash("#/explore-the-dream")?.path).toBe("/lucid-dream-experiments/");
    expect(resolveLegacyGuidebookHash("#/loosen-the-body")?.path).toBe("/out-of-body-experience-body-ownership/");
    expect(resolveLegacyGuidebookHash("#/feel-the-body")?.path).toBe("/body-scan-meditation/");
    expect(resolveLegacyGuidebookHash("#/feel-the-body#nighttime-body-release")).toEqual({
      path: "/body-scan-meditation/",
      fragment: "nighttime-body-release",
    });
  });
});
