import { describe, expect, it, vi } from "vitest";
import {
  AUDIOBOOK_GA4_EVENTS,
  trackAudiobookCheckoutStart,
  trackAudiobookOfferViewed,
  trackAudiobookSampleStart,
} from "./audiobookEvents.ts";

describe("audiobook GA4 events", () => {
  it("sends aggregate payloads only", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    trackAudiobookOfferViewed("landing");
    trackAudiobookSampleStart();
    trackAudiobookCheckoutStart();
    expect(gtag).toHaveBeenCalledTimes(3);
    const payload = JSON.stringify(gtag.mock.calls);
    expect(payload).not.toMatch(/cs_|price_|sk_|email|session/i);
    expect(gtag.mock.calls[0]?.[1]).toBe(AUDIOBOOK_GA4_EVENTS.offerViewed);
    expect(gtag.mock.calls[1]?.[1]).toBe(AUDIOBOOK_GA4_EVENTS.sampleStart);
    expect(gtag.mock.calls[2]?.[1]).toBe(AUDIOBOOK_GA4_EVENTS.checkoutStart);
  });
});
