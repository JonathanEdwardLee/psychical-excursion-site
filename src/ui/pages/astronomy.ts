import { snapshotAt, updateCadenceMs } from "../../astronomy/clock.ts";
import type { AstronomySnapshot } from "../../astronomy/compute.ts";
import {
  clearSessionObserver,
  readSessionObserver,
  requestDeviceLocation,
  writeSessionObserver,
} from "../../astronomy/location.ts";
import { statusBox } from "../bits.ts";
import { announce, el, formatWhen } from "../dom.ts";

let astronomyTimer: ReturnType<typeof setInterval> | null = null;
let visibilityHandler: (() => void) | null = null;

export function stopAstronomyClock(): void {
  if (astronomyTimer) clearInterval(astronomyTimer);
  astronomyTimer = null;
  if (visibilityHandler) {
    document.removeEventListener("visibilitychange", visibilityHandler);
    visibilityHandler = null;
  }
}

function formatRiseSet(iso: string | null): string {
  if (!iso) return "—";
  return formatWhen(Date.parse(iso));
}

function renderSnapshot(host: HTMLElement, snap: AstronomySnapshot): void {
  host.replaceChildren(
    el("div", { class: "astro-clock-head" }, [
      el("p", { class: "meta" }, [`Local · ${snap.localTimeLabel}`]),
      el("p", { class: "meta" }, [`UTC · ${snap.utcTimeLabel}`]),
    ]),
    el("section", { class: "astro-dial", "aria-label": "Sun and Moon instrument" }, [
      el("div", { class: "astro-sun-moon" }, [
        el("div", { class: "astro-body-card" }, [
          el("p", { class: "astro-glyph", "aria-hidden": "true" }, [snap.sun.glyph]),
          el("h3", {}, ["Sun"]),
          el("p", { class: "meta" }, [
            `Ecliptic longitude ${snap.sun.eclipticLongitudeDeg.toFixed(2)}°`,
          ]),
          snap.locationUsed && snap.sun.riseSet
            ? el("p", { class: "hint" }, [
                `Location-dependent: rise ${formatRiseSet(snap.sun.riseSet.rise)}, set ${formatRiseSet(snap.sun.riseSet.set)}`,
              ])
            : el("p", { class: "hint" }, ["Add location for local rise and set times."]),
          snap.locationUsed && snap.sun.horizon
            ? el("p", { class: "meta" }, [
                `Altitude ${snap.sun.horizon.altitudeDeg.toFixed(1)}° · azimuth ${snap.sun.horizon.azimuthDeg.toFixed(1)}°`,
              ])
            : el("span"),
        ]),
        el("div", { class: "astro-body-card" }, [
          el("p", { class: "astro-glyph", "aria-hidden": "true" }, [snap.moon.glyph]),
          el("h3", {}, ["Moon"]),
          el("p", {}, [`${snap.moon.phaseName} · ${snap.moon.illuminationPercent}% lit`]),
          el("p", { class: "meta" }, [
            `Phase angle ${snap.moon.phaseAngleDeg}° · ecliptic longitude ${snap.moon.eclipticLongitudeDeg.toFixed(2)}°`,
          ]),
          snap.moon.nextPrimaryPhase
            ? el("p", { class: "hint" }, [
                `Next ${snap.moon.nextPrimaryPhase.name}: ${formatWhen(Date.parse(snap.moon.nextPrimaryPhase.at))}`,
              ])
            : el("span"),
          snap.locationUsed && snap.moon.riseSet
            ? el("p", { class: "hint" }, [
                `Location-dependent: moonrise ${formatRiseSet(snap.moon.riseSet.rise)}, moonset ${formatRiseSet(snap.moon.riseSet.set)}`,
              ])
            : el("span"),
        ]),
      ]),
    ]),
    el("section", { class: "astro-planets" }, [
      el("h3", {}, ["Planets"]),
      el("p", { class: "hint" }, ["Geocentric ecliptic longitudes. Not astrology or prediction."]),
      el("ul", { class: "astro-planet-list" }, snap.planets.map((planet) =>
        el("li", { class: "astro-planet-item" }, [
          el("details", {}, [
            el("summary", {}, [
              el("span", { class: "astro-glyph-inline", "aria-hidden": "true" }, [planet.glyph]),
              el("span", {}, [` ${planet.name} · ${planet.eclipticLongitudeDeg.toFixed(2)}° ecliptic`]),
              el("span", { class: "meta" }, [` · ${planet.motion === "retrograde" ? "apparent retrograde" : "direct"}`]),
            ]),
            el("p", { class: "meta" }, [
              `${planet.accessibleLabel}: ecliptic longitude ${planet.eclipticLongitudeDeg.toFixed(2)} degrees. Motion: ${planet.motion}.`,
            ]),
            planet.horizon && snap.locationUsed
              ? el("p", { class: "hint" }, [
                  `Altitude ${planet.horizon.altitudeDeg.toFixed(1)}° · ${planet.horizon.aboveHorizon ? "above" : "below"} horizon (location-dependent).`,
                ])
              : el("span"),
          ]),
        ]),
      )),
    ]),
    snap.events.length
      ? el("section", { class: "astro-events" }, [
          el("h3", {}, ["Upcoming events"]),
          el("ul", { class: "plain" }, snap.events.map((event) =>
            el("li", {}, [`${event.label} · ${formatWhen(Date.parse(event.at))}`]),
          )),
        ])
      : el("span"),
  );
}

export function renderAstronomyPage(main: HTMLElement): void {
  stopAstronomyClock();
  const locationHost = el("div", { id: "astro-location-status" });
  const instrumentHost = el("div", { id: "astro-instrument", class: "astro-instrument" });

  let observer = readSessionObserver();
  let locationDenied = false;

  const paint = () => {
    const snap = snapshotAt(new Date(), observer);
    renderSnapshot(instrumentHost, snap);
  };

  const paintLocation = () => {
    locationHost.replaceChildren();
    if (observer) {
      locationHost.append(
        statusBox(
          "ok",
          "Location enabled for this session",
          "Rise, set, and horizon values are computed locally on this device. Coordinates are not sent to PEx servers.",
        ),
        el("button", { type: "button", id: "astro-clear-location" }, ["Clear location"]),
      );
      locationHost.querySelector("#astro-clear-location")?.addEventListener("click", () => {
        observer = null;
        clearSessionObserver();
        paintLocation();
        paint();
        announce("Location cleared. Core clock remains available.");
      });
      return;
    }
    if (locationDenied) {
      locationHost.append(
        statusBox(
          "info",
          "Location not available",
          "The celestial clock above is complete without location. You can retry when you want local sky times.",
        ),
      );
    } else {
      locationHost.append(
        statusBox(
          "info",
          "No location yet",
          "Sun/Moon phase and planetary longitudes work without location. Location adds rise/set and horizon — only when you choose.",
        ),
      );
    }
  };

  paintLocation();
  paint();

  const locationBtn = el("button", { type: "button", class: "primary", id: "astro-use-location" }, [
    "Use my location for local sky times",
  ]);
  locationBtn.addEventListener("click", () => {
    void (async () => {
      const result = await requestDeviceLocation();
      if (result.ok) {
        observer = result.location;
        writeSessionObserver(result.location);
        locationDenied = false;
        paintLocation();
        paint();
        announce("Location applied for local sky times.");
        return;
      }
      locationDenied = result.code === "denied" || result.code === "unsupported";
      paintLocation();
      announce("Location unavailable. Core astronomy clock unchanged.");
    })();
  });

  const reducedMotion =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;
  const cadence = updateCadenceMs(reducedMotion);
  astronomyTimer = setInterval(paint, cadence);
  visibilityHandler = () => {
    if (document.visibilityState === "visible") paint();
  };
  document.addEventListener("visibilitychange", visibilityHandler);

  main.append(
    el("article", { class: "surface astronomy-surface" }, [
      el("p", { class: "eyebrow" }, ["Celestial instrument"]),
      el("h2", { class: "display-title" }, ["Astronomy"]),
      el("p", { class: "lede" }, [
        "A quiet, factual clock: Sun, Moon, and planets from local calculations. Not a horoscope, weather map, or planetarium.",
      ]),
      locationHost,
      el("p", { class: "actions" }, [locationBtn]),
      instrumentHost,
      el("p", { class: "hint" }, [
        reducedMotion ? "Updates every two minutes (reduced motion)." : "Updates every minute while this page is open.",
      ]),
    ]),
  );
}
