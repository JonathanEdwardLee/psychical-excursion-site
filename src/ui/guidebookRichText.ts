import { NIGHTTIME_BODY_RELEASE_ID, PEX_GUIDEBOOK_LINKS, RELAX_THE_BODY_HREF } from "../content/guidebookAnchors.ts";
import { el } from "./dom.ts";

type RichTextOptions = {
  linkCitations?: boolean;
};

/** Strip sentence punctuation accidentally captured by `\S+` DOI/URL matchers. */
function stripLinkTrailingPunctuation(value: string): string {
  return value.replace(/[.,;:!?)]+$/u, "");
}

export function renderRichText(text: string, options: RichTextOptions = {}): HTMLElement {
  const { linkCitations = true } = options;
  const paragraph = el("span", { class: "guidebook-rich-text" });
  const mdLinkToken = String.raw`\[(?:[^\]]+)\]\((?:pex:[a-z0-9-]+|#\/[^)\s]+|\/[a-z0-9-/#]+)\)`;
  const pattern = linkCitations
    ? new RegExp(`(${mdLinkToken}|\\*\\*[^*]+\\*\\*|\\*[^*]+\\*|\\[\\d+\\]|https:\\/\\/\\S+|doi:10\\.\\S+)`, "gi")
    : new RegExp(`(${mdLinkToken}|\\*\\*[^*]+\\*\\*|\\*[^*]+\\*|https:\\/\\/\\S+|doi:10\\.\\S+)`, "gi");
  let lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) paragraph.append(text.slice(lastIndex, index));
    const token = match[0];
    const mdLink = token.match(/^\[([^\]]+)\]\((pex:[a-z0-9-]+|#\/[^)\s]+|\/[a-z0-9-/#]+)\)$/i);
    if (mdLink) {
      const label = mdLink[1]!;
      const destRaw = mdLink[2]!;
      const pexId = destRaw.toLowerCase().startsWith("pex:") ? destRaw.slice(4).toLowerCase() : "";
      const dest = pexId ? PEX_GUIDEBOOK_LINKS[pexId] : undefined;
      const href = dest?.href
        ?? (destRaw === RELAX_THE_BODY_HREF || destRaw.endsWith(`#${NIGHTTIME_BODY_RELEASE_ID}`)
          ? RELAX_THE_BODY_HREF
          : destRaw);
      const link = el("a", {
        href,
        class: "guidebook-pex-link",
        "data-pex-link": dest?.id,
      });
      const bold = label.match(/^\*\*(.+)\*\*$/);
      if (bold) link.append(el("strong", {}, [bold[1]!]));
      else link.append(label);
      paragraph.append(link);
    } else if (token.startsWith("**")) {
      paragraph.append(el("strong", {}, [token.slice(2, -2)]));
    } else if (token.startsWith("*")) {
      paragraph.append(el("em", {}, [token.slice(1, -1)]));
    } else if (/^\[\d+\]$/.test(token) && linkCitations) {
      const num = token.slice(1, -1);
      paragraph.append(
        el("a", { href: `#ref-${num}`, class: "guidebook-citation" }, [token]),
      );
    } else if (token.toLowerCase().startsWith("doi:10.")) {
      const doi = stripLinkTrailingPunctuation(token.slice(4));
      paragraph.append(
        el("a", {
          href: `https://doi.org/${doi}`,
          class: "guidebook-doi",
          rel: "noreferrer",
        }, [token]),
      );
    } else if (token.toLowerCase().startsWith("https://doi.org/")) {
      const href = stripLinkTrailingPunctuation(token);
      paragraph.append(
        el("a", {
          href,
          class: "guidebook-doi",
          rel: "noreferrer",
        }, [token]),
      );
    } else if (token.toLowerCase().startsWith("https://")) {
      const href = stripLinkTrailingPunctuation(token);
      paragraph.append(
        el("a", {
          href,
          class: "guidebook-external",
          rel: "noreferrer",
        }, [token]),
      );
    } else {
      paragraph.append(token);
    }
    lastIndex = index + token.length;
  }
  if (lastIndex < text.length) paragraph.append(text.slice(lastIndex));
  if (!paragraph.childNodes.length) paragraph.append(text);
  return paragraph;
}

export function renderRichParagraph(text: string, options?: RichTextOptions): HTMLElement {
  const wrap = el("p", {});
  wrap.append(renderRichText(text, options));
  return wrap;
}

export function renderReferenceItem(line: string): HTMLLIElement {
  const match = line.match(/^(?:\*\*)?\[(\d+)\](?:\*\*)?\s*(.*)$/);
  const num = match?.[1] ?? "0";
  const body = match?.[2] ?? line;
  const li = el("li", { id: `ref-${num}`, class: "guidebook-reference-item" });
  const label = el("span", { class: "guidebook-ref-num" }, [`[${num}] `]);
  li.append(label, renderRichText(body, { linkCitations: false }));
  li.tabIndex = -1;
  return li;
}

/** Keep citation hashes on the page so the hash router does not leave the chapter. */
export function bindInPageCitations(root: HTMLElement): void {
  for (const link of root.querySelectorAll<HTMLAnchorElement>("a.guidebook-citation")) {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href") ?? "";
      const match = href.match(/^#ref-(\d+)$/);
      if (!match) return;
      const target = root.querySelector<HTMLElement>(`#ref-${match[1]}`);
      if (!target) return;
      event.preventDefault();
      const reduced = typeof window.matchMedia === "function"
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      target.focus({ preventScroll: true });
    });
  }
  for (const link of root.querySelectorAll<HTMLAnchorElement>("a.guidebook-pex-link")) {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href") ?? "";
      let fragment = "";
      let samePage = true;
      try {
        const url = new URL(href, window.location.href);
        fragment = url.hash.replace(/^#/, "");
        const here = window.location.pathname.replace(/\/?$/, "/");
        const there = url.pathname.replace(/\/?$/, "/");
        samePage = there === here || there === "/" || href.startsWith("#");
      } catch {
        fragment = href.includes("#") ? href.split("#").pop() ?? "" : "";
      }
      if (!fragment || fragment.startsWith("/")) return;
      if (!samePage) return;
      const target = root.querySelector<HTMLElement>(`[id="${fragment}"]`);
      if (!target) return;
      event.preventDefault();
      target.closest(".guidebook-section")?.classList.add("is-visible");
      const reduced = typeof window.matchMedia === "function"
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      target.focus({ preventScroll: true });
    });
  }
}
