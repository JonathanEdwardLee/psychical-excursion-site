export const TROPICAL_ZODIAC_SIGNS = [
  { name: "Aries", glyph: "♈\uFE0E" },
  { name: "Taurus", glyph: "♉\uFE0E" },
  { name: "Gemini", glyph: "♊\uFE0E" },
  { name: "Cancer", glyph: "♋\uFE0E" },
  { name: "Leo", glyph: "♌\uFE0E" },
  { name: "Virgo", glyph: "♍\uFE0E" },
  { name: "Libra", glyph: "♎\uFE0E" },
  { name: "Scorpio", glyph: "♏\uFE0E" },
  { name: "Sagittarius", glyph: "♐\uFE0E" },
  { name: "Capricorn", glyph: "♑\uFE0E" },
  { name: "Aquarius", glyph: "♒\uFE0E" },
  { name: "Pisces", glyph: "♓\uFE0E" },
] as const;

export type TropicalZodiacSign = (typeof TROPICAL_ZODIAC_SIGNS)[number];

/** Equal 30° tropical Western zodiac sectors from geocentric ecliptic longitude. */
export function tropicalZodiacSign(eclipticLongitudeDeg: number): TropicalZodiacSign {
  const deg = ((eclipticLongitudeDeg % 360) + 360) % 360;
  return TROPICAL_ZODIAC_SIGNS[Math.floor(deg / 30) % 12]!;
}
