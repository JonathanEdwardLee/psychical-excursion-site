import { el } from "./dom.ts";

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string>,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

export type AmbientMode = "orbit" | "memory" | "notice" | "recognize";

/** Lightweight celestial-instrument field. CSS moves it; geometry stays simple. */
export function renderAmbientLayer(mode: AmbientMode): HTMLElement {
  const layer = el("div", {
    class: `pex-ambient pex-ambient-${mode}`,
    "aria-hidden": "true",
  });
  const svg = svgEl("svg", {
    viewBox: "0 0 1200 900",
    focusable: "false",
  });

  const slow = svgEl("g", { class: "pex-ambient-spin pex-ambient-spin-slow" });
  slow.append(
    svgEl("circle", { class: "pex-ambient-arc", cx: "620", cy: "430", r: "318" }),
    svgEl("circle", { class: "pex-ambient-arc pex-ambient-arc-faint", cx: "620", cy: "430", r: "214" }),
    svgEl("circle", { class: "pex-ambient-point", cx: "938", cy: "430", r: "2.2" }),
    svgEl("circle", { class: "pex-ambient-point", cx: "406", cy: "238", r: "1.6" }),
  );

  const mid = svgEl("g", { class: "pex-ambient-spin pex-ambient-spin-mid" });
  mid.append(
    svgEl("ellipse", {
      class: "pex-ambient-arc",
      cx: "580",
      cy: "400",
      rx: "430",
      ry: "168",
    }),
    svgEl("path", {
      class: "pex-ambient-arc pex-ambient-arc-partial",
      d: "M220 520 C 380 220, 820 180, 1040 470",
    }),
    svgEl("circle", { class: "pex-ambient-point", cx: "1010", cy: "400", r: "1.8" }),
  );

  const axis = svgEl("g", { class: "pex-ambient-axis" });
  axis.append(
    svgEl("line", { class: "pex-ambient-line", x1: "600", y1: "40", x2: "600", y2: "860" }),
    svgEl("line", { class: "pex-ambient-line pex-ambient-line-soft", x1: "80", y1: "390", x2: "1120", y2: "510" }),
  );

  svg.append(axis, slow, mid);

  if (mode === "memory") {
    const memory = svgEl("g", { class: "pex-ambient-memory-forms" });
    memory.append(
      svgEl("ellipse", {
        class: "pex-ambient-form pex-ambient-form-a",
        cx: "430",
        cy: "360",
        rx: "92",
        ry: "48",
      }),
      svgEl("ellipse", {
        class: "pex-ambient-form pex-ambient-form-b",
        cx: "760",
        cy: "500",
        rx: "70",
        ry: "110",
      }),
      svgEl("circle", {
        class: "pex-ambient-form pex-ambient-form-c",
        cx: "620",
        cy: "280",
        r: "36",
      }),
    );
    svg.append(memory);
  }

  if (mode === "notice" || mode === "recognize") {
    const notice = svgEl("g", { class: "pex-ambient-notice-align" });
    notice.append(
      svgEl("path", {
        class: "pex-ambient-arc pex-ambient-align-a",
        d: "M260 300 C 480 220, 700 240, 940 360",
      }),
      svgEl("path", {
        class: "pex-ambient-arc pex-ambient-align-b",
        d: "M300 620 C 520 420, 760 380, 980 520",
      }),
      svgEl("circle", { class: "pex-ambient-point pex-ambient-align-point", cx: "640", cy: "390", r: "2.4" }),
    );
    if (mode === "recognize") {
      notice.append(
        svgEl("circle", {
          class: "pex-ambient-form pex-ambient-recognize-ring",
          cx: "640",
          cy: "390",
          r: "5.5",
        }),
      );
    }
    svg.append(notice);
  }

  layer.append(svg);
  return layer;
}
