import type { ChapterDocument } from "../../content/guidebookChapter01.ts";
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
      const list = el("ol", { class: "guidebook-steps" });
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
    section.append(renderRichParagraph(block.text));
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
