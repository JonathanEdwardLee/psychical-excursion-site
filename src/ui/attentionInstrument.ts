import { el } from "./dom.ts";

export const ATTENTION_MOTION = {
  innerSeconds: 180,
  midSeconds: 240,
  outerSeconds: 300,
  breatheSeconds: 96,
  breatheScale: 1.028,
} as const;

const CX = 500;
const CY = 500;

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
): SVGElementTagNameMap[K] {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

function polar(radius: number, deg: number): [number, number] {
  const angle = ((deg - 90) * Math.PI) / 180;
  return [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)];
}

function points(count: number, radius: number, rotate = 0): string {
  return Array.from({ length: count }, (_, i) => polar(radius, (360 / count) * i + rotate).join(",")).join(" ");
}

function starPoints(count: number, outer: number, inner: number, rotate = 0): string {
  const coords: string[] = [];
  for (let i = 0; i < count; i += 1) {
    coords.push(polar(outer, (360 / count) * i + rotate).join(","));
    coords.push(polar(inner, (360 / count) * i + 180 / count + rotate).join(","));
  }
  return coords.join(" ");
}

function rhombus(angle: number, inner: number, outer: number, spread: number): string {
  return [
    polar(outer, angle),
    polar((inner + outer) / 2, angle - spread),
    polar(inner, angle),
    polar((inner + outer) / 2, angle + spread),
  ].map((pair) => pair.join(",")).join(" ");
}

function triangle(angle: number, inner: number, outer: number, spread: number): string {
  return [
    polar(outer, angle),
    polar(inner, angle - spread),
    polar(inner, angle + spread),
  ].map((pair) => pair.join(",")).join(" ");
}

function poly(
  parent: SVGElement,
  n: number,
  radius: number,
  rotate: number,
  extraClass: string,
): void {
  parent.append(svgEl("polygon", {
    class: extraClass,
    points: points(n, radius, rotate),
  }));
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function renderAttentionInstrument(): HTMLElement {
  const reduced = prefersReducedMotion();
  const figure = el("figure", {
    class: reduced
      ? "pex-attention-instrument is-static"
      : "pex-attention-instrument",
  });
  figure.setAttribute("role", "img");
  figure.setAttribute(
    "aria-label",
    "Original Psychical Excursion attention instrument: nested thin-line geometry around a fixed center. Looking toward the center is optional. Seeing no afterimage or mental picture is not required.",
  );

  const svg = svgEl("svg", {
    viewBox: "0 0 1000 1000",
    focusable: "false",
  });
  svg.style.setProperty("--pex-attention-inner", `${ATTENTION_MOTION.innerSeconds}s`);
  svg.style.setProperty("--pex-attention-mid", `${ATTENTION_MOTION.midSeconds}s`);
  svg.style.setProperty("--pex-attention-outer", `${ATTENTION_MOTION.outerSeconds}s`);
  svg.style.setProperty("--pex-attention-breathe", `${ATTENTION_MOTION.breatheSeconds}s`);

  const beyond = svgEl("g", { class: "pex-attention-layer pex-attention-beyond" });
  beyond.append(svgEl("polygon", {
    class: "pex-attention-line pex-attention-faintest",
    points: points(36, 486, 5),
  }));
  beyond.append(svgEl("circle", {
    class: "pex-attention-line pex-attention-faintest",
    cx: String(CX),
    cy: String(CY),
    r: "478",
  }));
  for (let i = 0; i < 72; i += 1) {
    const a = i * 5;
    const inner = polar(468, a);
    const outer = polar(i % 6 === 0 ? 492 : 484, a);
    beyond.append(svgEl("line", {
      class: "pex-attention-line pex-attention-faintest",
      x1: inner[0].toFixed(2),
      y1: inner[1].toFixed(2),
      x2: outer[0].toFixed(2),
      y2: outer[1].toFixed(2),
    }));
  }

  const outer = svgEl("g", { class: "pex-attention-layer pex-attention-spin-outer" });
  outer.append(svgEl("circle", {
    class: "pex-attention-line pex-attention-strong",
    cx: String(CX),
    cy: String(CY),
    r: "438",
  }));
  outer.append(svgEl("circle", {
    class: "pex-attention-line",
    cx: String(CX),
    cy: String(CY),
    r: "418",
  }));
  for (let i = 0; i < 144; i += 1) {
    const a = i * 2.5;
    const major = i % 12 === 0;
    const mid = i % 4 === 0;
    const start = polar(major ? 398 : mid ? 406 : 410, a);
    const end = polar(438, a);
    outer.append(svgEl("line", {
      class: major ? "pex-attention-line pex-attention-strong" : "pex-attention-line pex-attention-fine",
      x1: start[0].toFixed(2),
      y1: start[1].toFixed(2),
      x2: end[0].toFixed(2),
      y2: end[1].toFixed(2),
    }));
  }
  for (let i = 0; i < 8; i += 1) {
    const a = i * 45;
    outer.append(svgEl("polygon", {
      class: "pex-attention-line",
      points: rhombus(a, 442, 462, 3.2),
    }));
    const tip = polar(i % 2 === 0 ? 454 : 448, a);
    outer.append(svgEl("circle", {
      class: "pex-attention-fill pex-attention-fine",
      cx: tip[0].toFixed(2),
      cy: tip[1].toFixed(2),
      r: i % 2 === 0 ? "2.1" : "1.3",
    }));
  }
  for (const sweep of [18, 138, 258]) {
    outer.append(svgEl("path", {
      class: "pex-attention-line pex-attention-arc",
      d: arcPath(394, sweep, sweep + 84),
    }));
  }

  const mid = svgEl("g", { class: "pex-attention-layer pex-attention-spin-mid" });
  for (const radius of [372, 344, 316, 288]) {
    mid.append(svgEl("circle", {
      class: "pex-attention-line",
      cx: String(CX),
      cy: String(CY),
      r: String(radius),
    }));
  }
  poly(mid, 12, 372, 0, "pex-attention-line pex-attention-soft");
  poly(mid, 12, 372, 15, "pex-attention-line pex-attention-soft");
  for (let i = 0; i < 24; i += 1) {
    mid.append(svgEl("polygon", {
      class: "pex-attention-line",
      points: rhombus(i * 15, 300, 368, 5.4),
    }));
  }
  for (let i = 0; i < 36; i += 1) {
    mid.append(svgEl("polygon", {
      class: "pex-attention-line pex-attention-fine",
      points: triangle(i * 10, 248, 286, 3.6),
    }));
  }
  for (let i = 0; i < 24; i += 1) {
    const a = i * 15;
    const inner = polar(132, a);
    const outerPt = polar(i % 2 === 0 ? 368 : 316, a);
    mid.append(svgEl("line", {
      class: i % 2 === 0 ? "pex-attention-line" : "pex-attention-line pex-attention-fine",
      x1: inner[0].toFixed(2),
      y1: inner[1].toFixed(2),
      x2: outerPt[0].toFixed(2),
      y2: outerPt[1].toFixed(2),
    }));
  }

  const breathe = svgEl("g", { class: "pex-attention-layer pex-attention-breathe" });
  poly(breathe, 8, 236, 0, "pex-attention-line pex-attention-strong");
  poly(breathe, 8, 236, 22.5, "pex-attention-line");
  poly(breathe, 6, 204, 0, "pex-attention-line");
  poly(breathe, 6, 204, 30, "pex-attention-line");
  poly(breathe, 4, 176, 0, "pex-attention-line pex-attention-soft");
  poly(breathe, 4, 176, 45, "pex-attention-line pex-attention-soft");
  breathe.append(svgEl("polygon", {
    class: "pex-attention-line",
    points: starPoints(16, 220, 148, 0),
  }));
  breathe.append(svgEl("polygon", {
    class: "pex-attention-line pex-attention-fine",
    points: starPoints(12, 190, 126, 15),
  }));
  for (const radius of [168, 148, 128]) {
    breathe.append(svgEl("circle", {
      class: "pex-attention-line pex-attention-fine",
      cx: String(CX),
      cy: String(CY),
      r: String(radius),
    }));
  }

  const inner = svgEl("g", { class: "pex-attention-layer pex-attention-spin-inner" });
  for (let i = 0; i < 12; i += 1) {
    const [x, y] = polar(34, i * 30);
    inner.append(svgEl("circle", {
      class: "pex-attention-line",
      cx: x.toFixed(2),
      cy: y.toFixed(2),
      r: "34",
    }));
  }
  for (let i = 0; i < 8; i += 1) {
    inner.append(svgEl("polygon", {
      class: "pex-attention-line pex-attention-fine",
      points: rhombus(i * 45 + 22.5, 58, 108, 8),
    }));
  }
  poly(inner, 16, 96, 0, "pex-attention-line pex-attention-fine");
  poly(inner, 8, 72, 0, "pex-attention-line");
  inner.append(svgEl("circle", {
    class: "pex-attention-line",
    cx: String(CX),
    cy: String(CY),
    r: "54",
  }));
  for (let i = 0; i < 32; i += 1) {
    const a = i * 11.25;
    const start = polar(46, a);
    const end = polar(i % 4 === 0 ? 70 : 62, a);
    inner.append(svgEl("line", {
      class: "pex-attention-line pex-attention-fine",
      x1: start[0].toFixed(2),
      y1: start[1].toFixed(2),
      x2: end[0].toFixed(2),
      y2: end[1].toFixed(2),
    }));
  }

  const center = svgEl("g", { class: "pex-attention-layer pex-attention-center" });
  center.append(svgEl("circle", {
    class: "pex-attention-line pex-attention-strong",
    cx: String(CX),
    cy: String(CY),
    r: "18",
  }));
  center.append(svgEl("circle", {
    class: "pex-attention-line pex-attention-fine",
    cx: String(CX),
    cy: String(CY),
    r: "8",
  }));
  center.append(svgEl("circle", {
    class: "pex-attention-fill pex-attention-center-point",
    cx: String(CX),
    cy: String(CY),
    r: "2.2",
  }));

  svg.append(beyond, outer, mid, breathe, inner, center);
  figure.append(svg);
  return figure;
}

function arcPath(radius: number, startDeg: number, endDeg: number): string {
  const start = polar(radius, startDeg);
  const end = polar(radius, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start[0].toFixed(2)} ${start[1].toFixed(2)} A ${radius} ${radius} 0 ${large} 1 ${end[0].toFixed(2)} ${end[1].toFixed(2)}`;
}
