import { el } from "./dom.ts";

/** Circle + vertical axis derived from the approved lockup. Used for state, not decoration. */
export function opticMark(extraClass = ""): HTMLElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", `optic ${extraClass}`.trim());
  svg.setAttribute("viewBox", "0 0 24 48");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("class", "optic-ring");
  circle.setAttribute("cx", "12");
  circle.setAttribute("cy", "24");
  circle.setAttribute("r", "7.25");
  circle.setAttribute("fill", "none");
  circle.setAttribute("stroke", "currentColor");
  circle.setAttribute("stroke-width", "1.35");
  const fill = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  fill.setAttribute("class", "optic-fill");
  fill.setAttribute("cx", "12");
  fill.setAttribute("cy", "24");
  fill.setAttribute("r", "3.15");
  const axis = document.createElementNS("http://www.w3.org/2000/svg", "line");
  axis.setAttribute("class", "optic-axis");
  axis.setAttribute("x1", "12");
  axis.setAttribute("y1", "0");
  axis.setAttribute("x2", "12");
  axis.setAttribute("y2", "48");
  axis.setAttribute("stroke", "currentColor");
  axis.setAttribute("stroke-width", "1.35");
  svg.append(axis, circle, fill);
  const wrap = el("span", { class: "optic-wrap", "aria-hidden": "true" });
  wrap.append(svg);
  return wrap;
}

export const PHASE_INDEX_MARKS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"] as const;

export function padDay(day: number): string {
  return String(day).padStart(2, "0");
}
