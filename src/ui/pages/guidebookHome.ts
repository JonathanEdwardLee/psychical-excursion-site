import { CHAPTER_01_PATH, CHAPTER_01_TITLE } from "../../content/guidebookChapter01.ts";
import { INTRODUCTION_TITLE } from "../../content/guidebookCatalog.ts";
import { GUIDEBOOK_SUBTITLE, loadGuidebookManuscript } from "../../content/guidebookManuscript.ts";
import { el } from "../dom.ts";
import { renderReferenceItem, renderRichParagraph } from "../guidebookRichText.ts";

function newSection(first: boolean): HTMLElement {
  return el("section", {
    class: first ? "guidebook-section pex-reveal is-visible" : "guidebook-section pex-reveal",
  });
}

export function renderGuidebookHome(main: HTMLElement): void {
  const manuscript = loadGuidebookManuscript();
  const article = el("article", { class: "guidebook-article" });
  let section = newSection(true);
  article.append(section);
  section.append(
    el("p", { class: "guidebook-subtitle" }, [GUIDEBOOK_SUBTITLE]),
    el("h1", { class: "guidebook-opening-title" }, [INTRODUCTION_TITLE]),
    el("p", { class: "guidebook-opening-heading" }, [manuscript.openingHeading]),
    ...manuscript.openingParagraphs.map((paragraph) => renderRichParagraph(paragraph)),
  );

  for (const part of manuscript.sections) {
    section = newSection(false);
    article.append(section);
    section.append(el("h2", { class: "guidebook-section-title" }, [part.heading]));
    for (const paragraph of part.paragraphs) {
      if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
        section.append(el("p", { class: "guidebook-emphasis-line" }, [paragraph.slice(2, -2)]));
        continue;
      }
      section.append(renderRichParagraph(paragraph));
    }
  }

  if (manuscript.references.length) {
    section = newSection(false);
    article.append(section);
    section.append(el("h2", { class: "guidebook-section-title", id: "references" }, ["References"]));
    const list = el("ul", { class: "guidebook-references" });
    for (const line of manuscript.references) {
      list.append(renderReferenceItem(line));
    }
    section.append(list);
  }

  section = newSection(false);
  article.append(section);
  section.append(
    el("p", { class: "guidebook-next" }, [
      el("a", {
        href: CHAPTER_01_PATH,
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
