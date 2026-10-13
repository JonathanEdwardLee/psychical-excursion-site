import type { GtagFn } from "./ga4.ts";

export const AUDIOBOOK_GA4_EVENTS = {
  offerViewed: "pex_audiobook_offer_viewed",
  sampleStart: "pex_audiobook_sample_start",
  checkoutStart: "pex_audiobook_checkout_start",
  purchaseConfirmed: "pex_audiobook_purchase_confirmed",
} as const;

type AudiobookEventName = (typeof AUDIOBOOK_GA4_EVENTS)[keyof typeof AUDIOBOOK_GA4_EVENTS];

function gtagEvent(name: AudiobookEventName, params: Record<string, string | number>): void {
  const gtag = window.gtag as GtagFn | undefined;
  if (typeof gtag !== "function") return;
  gtag("event", name, params);
}

export function trackAudiobookOfferViewed(surface: "landing" | "audiobook"): void {
  gtagEvent(AUDIOBOOK_GA4_EVENTS.offerViewed, { surface });
}

export function trackAudiobookSampleStart(): void {
  gtagEvent(AUDIOBOOK_GA4_EVENTS.sampleStart, { content_type: "audiobook_sample" });
}

export function trackAudiobookCheckoutStart(): void {
  gtagEvent(AUDIOBOOK_GA4_EVENTS.checkoutStart, { currency: "USD" });
}
