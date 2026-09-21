import { snapshotAt } from "../astronomy/clock.ts";
import { el } from "./dom.ts";

/** Compact, non-interactive glance at sky state — no location, no navigation. */
export function renderSkyWidget(): HTMLElement {
  const snap = snapshotAt(new Date(), null);
  const label = `${snap.moon.phaseName} · ${snap.moon.illuminationPercent}% lit · ${snap.localTimeLabel}`;
  return el("div", {
    class: "sky-widget-compact",
    role: "img",
    "aria-label": label,
  }, [
    el("span", { class: "sky-widget-glyph", "aria-hidden": "true" }, [snap.moon.glyph]),
    el("span", { class: "sky-widget-text" }, [snap.moon.phaseName]),
  ]);
}
