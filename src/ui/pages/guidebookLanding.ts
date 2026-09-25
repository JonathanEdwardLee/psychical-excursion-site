import { INTRODUCTION_PATH } from "../../content/guidebookCatalog.ts";
import {
  LANDING_AFFIRMATION,
  LANDING_ENTRY_LABEL,
  LANDING_SYNOPSIS,
} from "../../content/guidebookLanding.ts";
import { renderAttentionInstrument } from "../attentionInstrument.ts";
import { el } from "../dom.ts";

export function renderGuidebookLanding(main: HTMLElement): void {
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
    el("p", { class: "guidebook-landing-synopsis" }, [LANDING_SYNOPSIS]),
  ]);
  main.append(article);
}
