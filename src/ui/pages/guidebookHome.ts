import { GUIDEBOOK_SUBTITLE, loadGuidebookManuscript } from "../../content/guidebookManuscript.ts";
import { el } from "../dom.ts";
import { renderReferenceItem, renderRichParagraph } from "../guidebookRichText.ts";

export function renderGuidebookHome(main: HTMLElement): void {
  const manuscript = loadGuidebookManuscript();
  const article = el("article", { class: "guidebook-article" }, [
    el("p", { class: "guidebook-subtitle" }, [GUIDEBOOK_SUBTITLE]),
    el("h2", { class: "guidebook-section-title" }, [manuscript.openingHeading]),
    ...manuscript.openingParagraphs.map((paragraph) => renderRichParagraph(paragraph)),
  ]);

  for (const section of manuscript.sections) {
    article.append(el("h2", { class: "guidebook-section-title" }, [section.heading]));
    for (const paragraph of section.paragraphs) {
      if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
        article.append(el("p", { class: "guidebook-emphasis-line" }, [paragraph.slice(2, -2)]));
        continue;
      }
      article.append(renderRichParagraph(paragraph));
    }
  }

  if (manuscript.references.length) {
    article.append(el("h2", { class: "guidebook-section-title", id: "references" }, ["References"]));
    const list = el("ul", { class: "guidebook-references" });
    for (const line of manuscript.references) {
      list.append(renderReferenceItem(line));
    }
    article.append(list);
  }

  main.append(article);
}
