import { loadGuidebookChapter01 } from "../../content/guidebookChapter01.ts";
import { el } from "../dom.ts";
import { renderReferenceItem, renderRichParagraph, renderRichText } from "../guidebookRichText.ts";

export function renderGuidebookChapter01(main: HTMLElement): void {
  const chapter = loadGuidebookChapter01();
  const article = el("article", { class: "guidebook-article guidebook-chapter" }, [
    el("h1", { class: "guidebook-chapter-title pex-reveal" }, [chapter.title]),
  ]);

  for (const block of chapter.blocks) {
    if (block.kind === "heading") {
      article.append(el("h2", { class: "guidebook-section-title pex-reveal" }, [block.text]));
      continue;
    }
    if (block.kind === "emphasis") {
      article.append(el("p", { class: "guidebook-emphasis-line pex-reveal" }, [block.text]));
      continue;
    }
    if (block.kind === "quote") {
      const quote = el("blockquote", { class: "guidebook-pull pex-reveal" });
      quote.append(renderRichText(block.text));
      article.append(quote);
      continue;
    }
    if (block.kind === "list") {
      const list = el("ol", { class: "guidebook-steps pex-reveal" });
      for (const item of block.items) {
        const li = el("li", {});
        li.append(renderRichText(item));
        list.append(li);
      }
      article.append(list);
      continue;
    }
    if (block.kind === "rule") {
      article.append(el("hr", { class: "guidebook-rule" }));
      continue;
    }
    article.append(renderRichParagraph(block.text));
  }

  if (chapter.references.length) {
    article.append(el("h2", { class: "guidebook-section-title pex-reveal", id: "references" }, ["References"]));
    const list = el("ul", { class: "guidebook-references" });
    for (const line of chapter.references) {
      list.append(renderReferenceItem(line));
    }
    article.append(list);
  }

  main.append(article);
}
