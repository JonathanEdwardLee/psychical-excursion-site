import { afterEach, describe, expect, it, vi } from "vitest";
import { GA4_MEASUREMENT_ID, resetGa4PublicPageViews, trackPublicGuidebookPageView } from "./ga4.ts";
import { CHAPTER_12_PATH } from "../content/guidebookChapter12.ts";
import { INTRODUCTION_PATH } from "../content/guidebookCatalog.ts";
import { overrideGuidebookLocation, resetGuidebookPageTracking } from "../ui/guidebookRoute.ts";

describe("GA4 public page views", () => {
  afterEach(() => {
    resetGa4PublicPageViews();
    resetGuidebookPageTracking();
    vi.unstubAllGlobals();
    window.history.replaceState(null, "", "/");
  });

  it("locks the founder Measurement ID and omits property/stream admin IDs", () => {
    expect(GA4_MEASUREMENT_ID).toBe("G-297PE2TV2R");
    expect(GA4_MEASUREMENT_ID).not.toMatch(/555962302/);
    expect(GA4_MEASUREMENT_ID).not.toMatch(/15841198465/);
  });

  it("sends one page_view per canonical pathname and skips fragments", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    document.title = "Psychical Excursion";
    overrideGuidebookLocation(INTRODUCTION_PATH);
    window.history.replaceState(null, "", INTRODUCTION_PATH);
    trackPublicGuidebookPageView();
    trackPublicGuidebookPageView();
    document.title = "Feel the Shift | Psychical Excursion";
    overrideGuidebookLocation(CHAPTER_12_PATH);
    window.history.replaceState(null, "", CHAPTER_12_PATH);
    trackPublicGuidebookPageView();
    overrideGuidebookLocation(CHAPTER_12_PATH, "#unused-fragment");
    window.history.replaceState(null, "", `${CHAPTER_12_PATH}#unused-fragment`);
    trackPublicGuidebookPageView();
    expect(gtag).toHaveBeenCalledTimes(2);
    const first = gtag.mock.calls[0]?.[2] as { page_path: string; page_title: string };
    const second = gtag.mock.calls[1]?.[2] as { page_path: string; page_title: string };
    expect(first.page_path).toBe(INTRODUCTION_PATH);
    expect(second.page_path).toBe(CHAPTER_12_PATH);
    expect(JSON.stringify(gtag.mock.calls)).not.toMatch(/journal|dream note|fixture/i);
  });
});
