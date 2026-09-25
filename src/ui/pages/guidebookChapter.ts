import type { ChapterBlock, ChapterDocument, PracticePart } from "../../content/guidebookChapter01.ts";
import { guidebookHeadingId } from "../../content/guidebookAnchors.ts";
import { el } from "../dom.ts";
import { renderAttentionInstrument } from "../attentionInstrument.ts";
import { renderReferenceItem, renderRichParagraph, renderRichText } from "../guidebookRichText.ts";

export type GuidebookNextReading = {
  href: string;
  title: string;
  id: string;
};

export type GuidebookChapterNav = {
  next?: GuidebookNextReading;
  previous?: GuidebookNextReading;
};

function newSection(first: boolean): HTMLElement {
  return el("section", {
    class: first ? "guidebook-section pex-reveal is-visible" : "guidebook-section pex-reveal",
  });
}

function appendFlowBlocks(section: HTMLElement, blocks: ChapterBlock[], subheadingClass = "guidebook-section-subheading"): void {
  for (const block of blocks) {
    if (block.kind === "emphasis") {
      section.append(el("p", { class: "guidebook-emphasis-line" }, [block.text]));
      continue;
    }
    if (block.kind === "quote") {
      const quote = el("blockquote", { class: "guidebook-pull" });
      quote.append(renderRichText(block.text));
      section.append(quote);
      continue;
    }
    if (block.kind === "list") {
      const list = el(block.ordered ? "ol" : "ul", { class: "guidebook-steps" });
      for (const item of block.items) {
        const li = el("li", {});
        li.append(renderRichText(item));
        list.append(li);
      }
      section.append(list);
      continue;
    }
    if (block.kind === "rule") {
      section.append(el("hr", { class: "guidebook-rule" }));
      continue;
    }
    if (block.kind === "heading" || block.kind === "practice" || block.kind === "attention") continue;
    if (block.kind === "subheading") {
      section.append(el("h3", { class: subheadingClass }, [block.text]));
      continue;
    }
    section.append(renderRichParagraph(block.text));
  }
}

function renderPracticePart(part: PracticePart): HTMLElement {
  const region = el("section", { class: "guidebook-practice-part" });
  region.append(el("h2", { class: "guidebook-practice-label" }, [part.label]));
  appendFlowBlocks(region, part.blocks, "guidebook-practice-subheading");
  return region;
}

function renderPrevious(previous: GuidebookNextReading): HTMLElement {
  return el("nav", { class: "guidebook-prev", "aria-label": "Previous reading" }, [
    el("a", {
      href: previous.href,
      class: "guidebook-prev-link",
      id: previous.id,
    }, [
      el("span", { class: "guidebook-prev-arrow", "aria-hidden": "true" }, ["← "]),
      previous.title,
    ]),
  ]);
}

export function renderGuidebookChapterPage(
  main: HTMLElement,
  chapter: ChapterDocument,
  nav: GuidebookChapterNav = {},
): void {
  const article = el("article", { class: "guidebook-article guidebook-chapter" });
  let section = newSection(true);
  article.append(section);
  if (nav.previous) section.append(renderPrevious(nav.previous));
  section.append(el("h1", { class: "guidebook-chapter-title" }, [chapter.title]));

  for (const block of chapter.blocks) {
    if (block.kind === "heading") {
      section = newSection(false);
      article.append(section);
      const heading = el("h2", { class: "guidebook-section-title" }, [block.text]);
      const id = guidebookHeadingId(block.text);
      if (id) {
        heading.id = id;
        heading.tabIndex = -1;
      }
      section.append(heading);
      continue;
    }
    if (block.kind === "practice") {
      section = newSection(false);
      article.append(section);
      const card = el("aside", {
        class: "guidebook-practice",
        "aria-label": "Summary, experiment, and intention",
      });
      for (const part of block.parts) card.append(renderPracticePart(part));
      section.append(card);
      continue;
    }
    if (block.kind === "attention") {
      section = newSection(false);
      article.append(section);
      section.append(renderAttentionInstrument());
      continue;
    }
    appendFlowBlocks(section, [block]);
  }

  if (chapter.references.length) {
    section = newSection(false);
    article.append(section);
    section.append(el("h2", { class: "guidebook-section-title", id: "references" }, ["References"]));
    const list = el("ul", { class: "guidebook-references" });
    for (const line of chapter.references) {
      list.append(renderReferenceItem(line));
    }
    section.append(list);
  }

  if (nav.next) {
    section = newSection(false);
    article.append(section);
    section.append(
      el("p", { class: "guidebook-next" }, [
        el("a", {
          href: nav.next.href,
          class: "guidebook-next-link",
          id: nav.next.id,
        }, [
          nav.next.title,
          el("span", { class: "guidebook-next-arrow", "aria-hidden": "true" }, [" →"]),
        ]),
      ]),
    );
  }

  main.append(article);
}
