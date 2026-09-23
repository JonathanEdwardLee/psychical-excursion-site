import type { ChapterBlock, ChapterDocument, PracticePart } from "../../content/guidebookChapter01.ts";
import { el } from "../dom.ts";
import { renderReferenceItem, renderRichParagraph, renderRichText } from "../guidebookRichText.ts";

export type GuidebookNextReading = {
  href: string;
  title: string;
  id: string;
};

function newSection(first: boolean): HTMLElement {
  return el("section", {
    class: first ? "guidebook-section pex-reveal is-visible" : "guidebook-section pex-reveal",
  });
}

function appendFlowBlocks(section: HTMLElement, blocks: ChapterBlock[]): void {
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
    if (block.kind === "heading" || block.kind === "practice") continue;
    section.append(renderRichParagraph(block.text));
  }
}

function renderPracticePart(part: PracticePart): HTMLElement {
  const region = el("section", { class: "guidebook-practice-part" });
  region.append(el("h2", { class: "guidebook-practice-label" }, [part.label]));
  appendFlowBlocks(region, part.blocks);
  return region;
}

export function renderGuidebookChapterPage(
  main: HTMLElement,
  chapter: ChapterDocument,
  next?: GuidebookNextReading,
): void {
  const article = el("article", { class: "guidebook-article guidebook-chapter" });
  let section = newSection(true);
  article.append(section);
  section.append(el("h1", { class: "guidebook-chapter-title" }, [chapter.title]));

  for (const block of chapter.blocks) {
    if (block.kind === "heading") {
      section = newSection(false);
      article.append(section);
      const heading = el("h2", { class: "guidebook-section-title" }, [block.text]);
      if (block.text === "References") heading.id = "references";
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

  if (next) {
    section = newSection(false);
    article.append(section);
    section.append(
      el("p", { class: "guidebook-next" }, [
        el("a", {
          href: next.href,
          class: "guidebook-next-link",
          id: next.id,
        }, [
          next.title,
          el("span", { class: "guidebook-next-arrow", "aria-hidden": "true" }, [" →"]),
        ]),
      ]),
    );
  }

  main.append(article);
}
