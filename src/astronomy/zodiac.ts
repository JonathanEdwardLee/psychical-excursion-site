export const TROPICAL_ZODIAC_SIGNS = [
  { name: "Aries", glyph: "♈" },
  { name: "Taurus", glyph: "♉" },
  { name: "Gemini", glyph: "♊" },
  { name: "Cancer", glyph: "♋" },
  { name: "Leo", glyph: "♌" },
  { name: "Virgo", glyph: "♍" },
  { name: "Libra", glyph: "♎" },
  { name: "Scorpio", glyph: "♏" },
  { name: "Sagittarius", glyph: "♐" },
  { name: "Capricorn", glyph: "♑" },
  { name: "Aquarius", glyph: "♒" },
  { name: "Pisces", glyph: "♓" },
] as const;

export type TropicalZodiacSign = (typeof TROPICAL_ZODIAC_SIGNS)[number];

/** Equal 30° tropical Western zodiac sectors from geocentric ecliptic longitude. */
export function tropicalZodiacSign(eclipticLongitudeDeg: number): TropicalZodiacSign {
  const deg = ((eclipticLongitudeDeg % 360) + 360) % 360;
  return TROPICAL_ZODIAC_SIGNS[Math.floor(deg / 30) % 12]!;
}
