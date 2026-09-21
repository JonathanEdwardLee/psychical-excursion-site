import { GUIDEBOOK_SUBTITLE, loadGuidebookManuscript } from "../../content/guidebookManuscript.ts";
import { el } from "../dom.ts";

function renderInlineParagraph(text: string): HTMLElement {
  const paragraph = el("p", {});
  const pattern = /(\*[^*]+\*)/g;
  let lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) paragraph.append(text.slice(lastIndex, index));
    const inner = match[1]!.slice(1, -1);
    paragraph.append(el("em", {}, [inner]));
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) paragraph.append(text.slice(lastIndex));
  if (!paragraph.childNodes.length) paragraph.append(text);
  return paragraph;
}

export function renderGuidebookHome(main: HTMLElement): void {
  const manuscript = loadGuidebookManuscript();
  const article = el("article", { class: "guidebook-article" }, [
    el("p", { class: "guidebook-subtitle" }, [GUIDEBOOK_SUBTITLE]),
    el("h2", { class: "guidebook-section-title" }, [manuscript.openingHeading]),
    ...manuscript.openingParagraphs.map((paragraph) => renderInlineParagraph(paragraph)),
  ]);

  for (const section of manuscript.sections) {
    article.append(el("h2", { class: "guidebook-section-title" }, [section.heading]));
    for (const paragraph of section.paragraphs) {
      if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
        article.append(el("p", { class: "guidebook-emphasis-line" }, [paragraph.slice(2, -2)]));
        continue;
      }
      article.append(renderInlineParagraph(paragraph));
    }
  }

  if (manuscript.references.length) {
    article.append(el("h2", { class: "guidebook-section-title" }, ["References"]));
    const list = el("ol", { class: "guidebook-references" });
    for (const line of manuscript.references) {
      list.append(el("li", {}, [renderInlineParagraph(line)]));
    }
    article.append(list);
  }

  main.append(article);
}
