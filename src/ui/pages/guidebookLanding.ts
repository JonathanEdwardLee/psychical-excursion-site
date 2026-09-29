import { AUDIOBOOK_PATH, AUDIOBOOK_PRICE_USD, AUDIOBOOK_TITLE } from "../../content/audiobookDirectSale.ts";
import { INTRODUCTION_PATH } from "../../content/guidebookCatalog.ts";
import {
  LANDING_AFFIRMATION,
  LANDING_ENTRY_LABEL,
  LANDING_SYNOPSIS,
} from "../../content/guidebookLanding.ts";
import { trackAudiobookOfferViewed } from "../../analytics/audiobookEvents.ts";
import { renderAttentionInstrument } from "../attentionInstrument.ts";
import { el } from "../dom.ts";

export function renderGuidebookLanding(main: HTMLElement): void {
  trackAudiobookOfferViewed("landing");
  const instrument = renderAttentionInstrument();
  const article = el("article", { class: "guidebook-article guidebook-landing" }, [
    el("h1", { class: "visually-hidden" }, ["Psychical Excursion"]),
    el("div", { class: "guidebook-landing-mandala" }, [instrument]),
    el("p", { class: "guidebook-landing-affirmation" }, [LANDING_AFFIRMATION]),
    el("p", { class: "guidebook-book-entry" }, [
      el("a", {
        href: INTRODUCTION_PATH,
        class: "guidebook-next-link guidebook-book-entry-link",
        id: "guidebook-enter-book",
      }, [
        LANDING_ENTRY_LABEL,
        el("span", { class: "guidebook-next-arrow", "aria-hidden": "true" }, [" →"]),
      ]),
    ]),
    el("section", { class: "guidebook-landing-audiobook", "aria-labelledby": "landing-audiobook-heading" }, [
      el("h2", { id: "landing-audiobook-heading", class: "guidebook-landing-audiobook-title" }, ["Audiobook"]),
      el("p", { class: "guidebook-landing-audiobook-copy" }, [
        `${AUDIOBOOK_TITLE}. $${AUDIOBOOK_PRICE_USD.toFixed(2)} · free Chapter 1 sample · direct download after purchase.`,
      ]),
      el("p", { class: "guidebook-landing-audiobook-cta" }, [
        el("a", {
          href: AUDIOBOOK_PATH,
          class: "guidebook-next-link",
          id: "landing-audiobook-link",
        }, [
          "Listen to the sample",
          el("span", { class: "guidebook-next-arrow", "aria-hidden": "true" }, [" →"]),
        ]),
      ]),
    ]),
    el("p", { class: "guidebook-landing-synopsis" }, [LANDING_SYNOPSIS]),
  ]);
  main.append(article);
}
