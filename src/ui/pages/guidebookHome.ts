import { CHAPTER_01_HASH, CHAPTER_01_TITLE } from "../../content/guidebookChapter01.ts";
import { GUIDEBOOK_SUBTITLE, loadGuidebookManuscript } from "../../content/guidebookManuscript.ts";
import { el } from "../dom.ts";
import { renderReferenceItem, renderRichParagraph } from "../guidebookRichText.ts";

export function renderGuidebookHome(main: HTMLElement): void {
  const manuscript = loadGuidebookManuscript();
  const article = el("article", { class: "guidebook-article" }, [
    el("p", { class: "guidebook-subtitle pex-reveal" }, [GUIDEBOOK_SUBTITLE]),
    el("h1", { class: "guidebook-opening-title pex-reveal" }, [manuscript.openingHeading]),
    ...manuscript.openingParagraphs.map((paragraph) => renderRichParagraph(paragraph)),
  ]);

  for (const section of manuscript.sections) {
    article.append(el("h2", { class: "guidebook-section-title pex-reveal" }, [section.heading]));
    for (const paragraph of section.paragraphs) {
      if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
        article.append(el("p", { class: "guidebook-emphasis-line pex-reveal" }, [paragraph.slice(2, -2)]));
        continue;
      }
      article.append(renderRichParagraph(paragraph));
    }
  }

  if (manuscript.references.length) {
    article.append(el("h2", { class: "guidebook-section-title pex-reveal", id: "references" }, ["References"]));
    const list = el("ul", { class: "guidebook-references" });
    for (const line of manuscript.references) {
      list.append(renderReferenceItem(line));
    }
    article.append(list);
  }

  article.append(
    el("p", { class: "guidebook-next pex-reveal" }, [
      el("a", {
        href: CHAPTER_01_HASH,
        class: "guidebook-next-link",
        id: "guidebook-next-chapter",
      }, [
        CHAPTER_01_TITLE,
        el("span", { class: "guidebook-next-arrow", "aria-hidden": "true" }, [" →"]),
      ]),
    ]),
  );

  main.append(article);
}
