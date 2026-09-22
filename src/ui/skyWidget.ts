import { nextFullMoon } from "../astronomy/compute.ts";
import { snapshotAt } from "../astronomy/clock.ts";
import { MOON_GLYPH, SUN_GLYPH, TEXT_PRESENTATION } from "../astronomy/constants.ts";
import { tropicalZodiacSign } from "../astronomy/zodiac.ts";
import { el } from "./dom.ts";

function formatFullMoonWhen(at: Date): { date: string; time: string; spoken: string } {
  const date = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(at);
  const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(at);
  const spoken = new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(at);
  return { date, time, spoken };
}

/** Compact observational Sun/Moon tropical-zodiac glance — no location, no interpretation. */
export function renderSkyWidget(): HTMLElement {
  const now = new Date();
  const snap = snapshotAt(now, null);
  const sunSign = tropicalZodiacSign(snap.sun.eclipticLongitudeDeg);
  const moonSign = tropicalZodiacSign(snap.moon.eclipticLongitudeDeg);
  const full = nextFullMoon(now);
  const when = full ? formatFullMoonWhen(full) : null;
  const spoken = when
    ? `Sun in ${sunSign.name}. Moon in ${moonSign.name}. Next full moon ${when.spoken}.`
    : `Sun in ${sunSign.name}. Moon in ${moonSign.name}.`;

  const fullNode = when
    ? el("span", { class: "sky-widget-full" }, [
        el("span", { class: "sky-widget-full-label" }, ["Full Moon · "]),
        el("span", { class: "sky-widget-full-when" }, [`${when.date} · ${when.time}`]),
      ])
    : el("span", { class: "sky-widget-full" }, ["Full Moon"]);

  return el("div", {
    class: "sky-widget-compact",
    role: "group",
    "aria-label": spoken,
  }, [
    el("span", { class: "sky-widget-pair" }, [
      el("span", { class: "sky-widget-body", "aria-hidden": "true" }, [`${SUN_GLYPH}${TEXT_PRESENTATION}`]),
      el("span", { class: "sky-widget-sign", "aria-hidden": "true" }, [sunSign.glyph]),
    ]),
    el("span", { class: "sky-widget-pair" }, [
      el("span", { class: "sky-widget-body", "aria-hidden": "true" }, [`${MOON_GLYPH}${TEXT_PRESENTATION}`]),
      el("span", { class: "sky-widget-sign", "aria-hidden": "true" }, [moonSign.glyph]),
    ]),
    fullNode,
  ]);
}
