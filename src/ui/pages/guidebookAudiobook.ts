import {
  AUDIOBOOK_AI_NARRATION_LABEL,
  AUDIOBOOK_BUYER_SUPPORT_LINES,
  AUDIOBOOK_CHAPTER_COUNT,
  AUDIOBOOK_CHECKOUT_PATH,
  AUDIOBOOK_FOUNDER_NOTE_PARAGRAPHS,
  AUDIOBOOK_PRICE_USD,
  AUDIOBOOK_RUNTIME_LABEL,
  AUDIOBOOK_SAMPLE_MP3_PATH,
  AUDIOBOOK_TITLE,
} from "../../content/audiobookDirectSale.ts";
import { INTRODUCTION_PATH, LANDING_PATH } from "../../content/guidebookCatalog.ts";
import {
  trackAudiobookCheckoutStart,
  trackAudiobookOfferViewed,
  trackAudiobookSampleStart,
} from "../../analytics/audiobookEvents.ts";
import { el } from "../dom.ts";

function formatPrice(): string {
  return `$${AUDIOBOOK_PRICE_USD.toFixed(2)}`;
}

function bindSamplePlayer(audio: HTMLAudioElement): void {
  let started = false;
  audio.addEventListener("play", () => {
    if (started) return;
    started = true;
    trackAudiobookSampleStart();
  });
}

function bindCheckout(link: HTMLAnchorElement): void {
  link.addEventListener("click", () => {
    trackAudiobookCheckoutStart();
  });
}

export function renderGuidebookAudiobook(main: HTMLElement): void {
  trackAudiobookOfferViewed("audiobook");

  const audio = el("audio", {
    class: "audiobook-sample-player",
    controls: "",
    preload: "metadata",
    "aria-label": "Chapter 1 sample — What Is a Psychical Excursion?",
  }) as HTMLAudioElement;
  audio.src = AUDIOBOOK_SAMPLE_MP3_PATH;
  bindSamplePlayer(audio);

  const checkout = el("a", {
    href: AUDIOBOOK_CHECKOUT_PATH,
    class: "audiobook-buy-button guidebook-next-link",
    id: "audiobook-checkout",
  }, [
    `Buy for ${formatPrice()}`,
    el("span", { class: "guidebook-next-arrow", "aria-hidden": "true" }, [" →"]),
  ]) as HTMLAnchorElement;
  bindCheckout(checkout);

  const founderNote = el("div", { class: "audiobook-founder-note" }, [
    el("p", { class: "audiobook-ai-label" }, [AUDIOBOOK_AI_NARRATION_LABEL]),
    ...AUDIOBOOK_FOUNDER_NOTE_PARAGRAPHS.map((paragraph) =>
      el("p", {}, [paragraph]),
    ),
  ]);

  const support = el("ul", { class: "audiobook-support-list" }, [
    ...AUDIOBOOK_BUYER_SUPPORT_LINES.map((line) => el("li", {}, [line])),
  ]);

  const article = el("article", { class: "guidebook-article audiobook-sale" }, [
    el("p", { class: "guidebook-kicker" }, [
      el("a", { href: LANDING_PATH, class: "guidebook-inline-link" }, ["Home"]),
      " · Audiobook",
    ]),
    el("h1", {}, [AUDIOBOOK_TITLE]),
    el("p", { class: "audiobook-lede" }, [
      `${formatPrice()} · ${AUDIOBOOK_RUNTIME_LABEL} · ${AUDIOBOOK_CHAPTER_COUNT} chapters · direct download after purchase`,
    ]),
    el("section", { class: "audiobook-sample", "aria-labelledby": "audiobook-sample-heading" }, [
      el("h2", { id: "audiobook-sample-heading" }, ["Free Chapter 1 sample"]),
      el("p", { class: "meta" }, ["Listen before you buy. No autoplay."]),
      audio,
    ]),
    el("section", { class: "audiobook-purchase", "aria-labelledby": "audiobook-purchase-heading" }, [
      el("h2", { id: "audiobook-purchase-heading" }, ["Purchase"]),
      el("p", {}, ["One-time payment. No subscription."]),
      checkout,
    ]),
    el("section", { class: "audiobook-disclosure", "aria-labelledby": "audiobook-disclosure-heading" }, [
      el("h2", { id: "audiobook-disclosure-heading", class: "visually-hidden" }, ["AI narration note"]),
      founderNote,
    ]),
    el("section", { class: "audiobook-support", "aria-labelledby": "audiobook-support-heading" }, [
      el("h2", { id: "audiobook-support-heading" }, ["Delivery & support"]),
      support,
    ]),
    el("p", { class: "audiobook-free-book" }, [
      "The written guide remains free. ",
      el("a", { href: INTRODUCTION_PATH, class: "guidebook-inline-link" }, ["Read Psychical Excursion"]),
      ".",
    ]),
  ]);

  main.append(article);
}
