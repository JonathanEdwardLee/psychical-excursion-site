import { afterEach, describe, expect, it, vi } from "vitest";
import { GA4_MEASUREMENT_ID, resetGa4PublicPageViews, trackPublicGuidebookPageView } from "./ga4.ts";

describe("GA4 public page views", () => {
  afterEach(() => {
    resetGa4PublicPageViews();
    vi.unstubAllGlobals();
    window.location.hash = "";
  });

  it("locks the founder Measurement ID and omits property/stream admin IDs", () => {
    expect(GA4_MEASUREMENT_ID).toBe("G-297PE2TV2R");
    expect(GA4_MEASUREMENT_ID).not.toMatch(/555962302/);
    expect(GA4_MEASUREMENT_ID).not.toMatch(/15841198465/);
  });

  it("sends one page_view per hash-route change and skips duplicate paths", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    document.title = "Psychical Excursion";
    window.location.hash = "#/";
    trackPublicGuidebookPageView();
    window.location.hash = "#/";
    trackPublicGuidebookPageView();
    document.title = "Feel the Shift. · Psychical Excursion";
    window.location.hash = "#/feel-the-shift";
    trackPublicGuidebookPageView();
    window.location.hash = "#/feel-the-shift#unused-fragment";
    trackPublicGuidebookPageView();
    expect(gtag).toHaveBeenCalledTimes(2);
    expect(gtag.mock.calls[0]?.[0]).toBe("event");
    expect(gtag.mock.calls[0]?.[1]).toBe("page_view");
    const first = gtag.mock.calls[0]?.[2] as { page_path: string; page_title: string };
    const second = gtag.mock.calls[1]?.[2] as { page_path: string; page_title: string };
    expect(first.page_path).toMatch(/#\/$/);
    expect(first.page_title).toBe("Psychical Excursion");
    expect(second.page_path).toMatch(/#\/feel-the-shift$/);
    expect(second.page_title).toMatch(/Feel the Shift/);
    expect(JSON.stringify(gtag.mock.calls)).not.toMatch(/journal|dream note|fixture/i);
  });
});
