import {
  Body,
  Equator,
  Ecliptic,
  EclipticLongitude,
  GeoVector,
  Horizon,
  Illumination,
  MakeTime,
  MoonPhase,
  Observer,
  SearchMoonPhase,
  SearchRiseSet,
  type FlexibleDateTime,
} from "astronomy-engine";
import { MOON_GLYPH, moonPhaseName, PLANET_BAND, PRIMARY_MOON_PHASES, SUN_GLYPH } from "./constants.ts";

export type ObserverLocation = {
  latitude: number;
  longitude: number;
  heightMeters: number;
};

export type HorizonSnapshot = {
  altitudeDeg: number;
  azimuthDeg: number;
  aboveHorizon: boolean;
};

export type RiseSetSnapshot = {
  rise: string | null;
  set: string | null;
  transitHint: string | null;
};

export type MoonSnapshot = {
  glyph: string;
  accessibleLabel: string;
  phaseName: string;
  illuminationPercent: number;
  phaseAngleDeg: number;
  eclipticLongitudeDeg: number;
  nextPrimaryPhase: { name: string; at: string } | null;
  horizon: HorizonSnapshot | null;
  riseSet: RiseSetSnapshot | null;
};

export type SunSnapshot = {
  glyph: string;
  accessibleLabel: string;
  eclipticLongitudeDeg: number;
  horizon: HorizonSnapshot | null;
  riseSet: RiseSetSnapshot | null;
};

export type PlanetSnapshot = {
  glyph: string;
  name: string;
  accessibleLabel: string;
  eclipticLongitudeDeg: number;
  motion: "direct" | "retrograde" | "unknown";
  horizon: HorizonSnapshot | null;
  riseSet: RiseSetSnapshot | null;
};

export type CelestialEvent = {
  label: string;
  at: string;
};

export type AstronomySnapshot = {
  computedAt: string;
  localTimeLabel: string;
  utcTimeLabel: string;
  sun: SunSnapshot;
  moon: MoonSnapshot;
  planets: PlanetSnapshot[];
  events: CelestialEvent[];
  locationUsed: boolean;
};

function formatLocal(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatUtc(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

function toObserver(location: ObserverLocation): Observer {
  return new Observer(location.latitude, location.longitude, location.heightMeters);
}

function bodyHorizon(body: Body, time: FlexibleDateTime, observer: Observer): HorizonSnapshot {
  const eq = Equator(body, time, observer, true, true);
  const h = Horizon(time, observer, eq.ra, eq.dec, "normal");
  return {
    altitudeDeg: h.altitude,
    azimuthDeg: h.azimuth,
    aboveHorizon: h.altitude > 0,
  };
}

function bodyRiseSet(body: Body, time: FlexibleDateTime, observer: Observer): RiseSetSnapshot {
  const rise = SearchRiseSet(body, observer, +1, time, 2);
  const set = SearchRiseSet(body, observer, -1, time, 2);
  return {
    rise: rise ? rise.date.toISOString() : null,
    set: set ? set.date.toISOString() : null,
    transitHint: null,
  };
}

function apparentMotion(body: Body, time: FlexibleDateTime): "direct" | "retrograde" {
  const lon0 = EclipticLongitude(body, time);
  const later = MakeTime(time).AddDays(3);
  const lon1 = EclipticLongitude(body, later);
  let delta = lon1 - lon0;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta >= 0 ? "direct" : "retrograde";
}

function nextMoonPrimaryPhase(time: FlexibleDateTime): { name: string; at: string } | null {
  let best: { name: string; at: string; ms: number } | null = null;
  const start = MakeTime(time);
  for (const phase of PRIMARY_MOON_PHASES) {
    const found = SearchMoonPhase(phase.angle, start, 40);
    if (!found) continue;
    const ms = found.date.getTime() - start.date.getTime();
    if (ms < 0) continue;
    if (!best || ms < best.ms) {
      best = { name: phase.name, at: found.date.toISOString(), ms };
    }
  }
  return best ? { name: best.name, at: best.at } : null;
}

function upcomingEvents(time: FlexibleDateTime): CelestialEvent[] {
  const events: CelestialEvent[] = [];
  const next = nextMoonPrimaryPhase(time);
  if (next) events.push({ label: `Moon · ${next.name}`, at: next.at });
  return events.slice(0, 4);
}

export function computeAstronomySnapshot(at: Date, location?: ObserverLocation | null): AstronomySnapshot {
  const time = MakeTime(at);
  const observer = location ? toObserver(location) : null;

  const sunLon = Ecliptic(GeoVector(Body.Sun, time, true)).elon;
  const sun: SunSnapshot = {
    glyph: SUN_GLYPH,
    accessibleLabel: "Sun",
    eclipticLongitudeDeg: sunLon,
    horizon: observer ? bodyHorizon(Body.Sun, time, observer) : null,
    riseSet: observer ? bodyRiseSet(Body.Sun, time, observer) : null,
  };

  const moonIllum = Illumination(Body.Moon, time);
  const moonPhaseAngle = MoonPhase(time);
  const moonLon = Ecliptic(GeoVector(Body.Moon, time, true)).elon;
  const moon: MoonSnapshot = {
    glyph: MOON_GLYPH,
    accessibleLabel: "Moon",
    phaseName: moonPhaseName(moonPhaseAngle),
    illuminationPercent: Math.round(moonIllum.phase_fraction * 1000) / 10,
    phaseAngleDeg: Math.round(moonIllum.phase_angle * 10) / 10,
    eclipticLongitudeDeg: Math.round(moonLon * 100) / 100,
    nextPrimaryPhase: nextMoonPrimaryPhase(time),
    horizon: observer ? bodyHorizon(Body.Moon, time, observer) : null,
    riseSet: observer ? bodyRiseSet(Body.Moon, time, observer) : null,
  };

  const planets: PlanetSnapshot[] = PLANET_BAND.map((planet) => {
    const lon = EclipticLongitude(planet.body, time);
    return {
      glyph: planet.glyph,
      name: planet.name,
      accessibleLabel: planet.name,
      eclipticLongitudeDeg: Math.round(lon * 100) / 100,
      motion: apparentMotion(planet.body, time),
      horizon: observer ? bodyHorizon(planet.body, time, observer) : null,
      riseSet: observer ? bodyRiseSet(planet.body, time, observer) : null,
    };
  });

  return {
    computedAt: at.toISOString(),
    localTimeLabel: formatLocal(at),
    utcTimeLabel: formatUtc(at),
    sun,
    moon,
    planets,
    events: upcomingEvents(time),
    locationUsed: Boolean(observer),
  };
}
