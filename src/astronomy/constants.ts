import { Body } from "astronomy-engine";

export const ASTRONOMY_ENGINE_VERSION = "2.1.19";

export const SUN_GLYPH = "☉";
export const MOON_GLYPH = "☽";

export const PLANET_BAND = [
  { body: Body.Mercury, glyph: "☿", name: "Mercury" },
  { body: Body.Venus, glyph: "♀", name: "Venus" },
  { body: Body.Mars, glyph: "♂", name: "Mars" },
  { body: Body.Jupiter, glyph: "♃", name: "Jupiter" },
  { body: Body.Saturn, glyph: "♄", name: "Saturn" },
  { body: Body.Uranus, glyph: "♅", name: "Uranus" },
  { body: Body.Neptune, glyph: "♆", name: "Neptune" },
] as const;

const ECLIPTIC_CONSTELLATIONS: Array<{ start: number; name: string }> = [
  { start: 0, name: "Pisces" },
  { start: 30, name: "Aries" },
  { start: 60, name: "Taurus" },
  { start: 90, name: "Gemini" },
  { start: 120, name: "Cancer" },
  { start: 150, name: "Leo" },
  { start: 180, name: "Virgo" },
  { start: 210, name: "Libra" },
  { start: 240, name: "Scorpius" },
  { start: 270, name: "Sagittarius" },
  { start: 300, name: "Capricornus" },
  { start: 330, name: "Aquarius" },
];

export function constellationAlongEcliptic(longitudeDeg: number): string {
  const lon = ((longitudeDeg % 360) + 360) % 360;
  let name = ECLIPTIC_CONSTELLATIONS[0]!.name;
  for (const row of ECLIPTIC_CONSTELLATIONS) {
    if (lon >= row.start) name = row.name;
  }
  return name;
}

export function moonPhaseName(moonPhaseAngleDeg: number): string {
  const a = ((moonPhaseAngleDeg % 360) + 360) % 360;
  if (a < 22.5 || a >= 337.5) return "New Moon";
  if (a < 67.5) return "Waxing crescent";
  if (a < 112.5) return "First quarter";
  if (a < 157.5) return "Waxing gibbous";
  if (a < 202.5) return "Full Moon";
  if (a < 247.5) return "Waning gibbous";
  if (a < 292.5) return "Last quarter";
  return "Waning crescent";
}

export const PRIMARY_MOON_PHASES = [
  { angle: 0, name: "New Moon" },
  { angle: 90, name: "First quarter" },
  { angle: 180, name: "Full Moon" },
  { angle: 270, name: "Last quarter" },
] as const;
