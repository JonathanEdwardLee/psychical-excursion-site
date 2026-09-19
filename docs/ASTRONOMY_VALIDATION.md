# Astronomy validation note (V2C)

## Library

- **Package:** `astronomy-engine`
- **Version:** 2.1.19 (see `src/astronomy/constants.ts`)
- **License:** MIT
- **Runtime:** Local browser calculations only — no astronomy HTTP API.

## Reference spot-checks (automated)

| Instant (UTC) | Observer | Quantity | Reference | Observed (PEx) | Tolerance |
| --- | --- | --- | --- | --- | --- |
| 2024-01-15T12:00:00Z | none | Moon illumination | Astronomy Engine `Illumination` | ~21.5% | ±2% |
| 2024-01-15T12:00:00Z | Washington, DC | Sun rise time | USNO-style expectation ~12:25 UTC | ~12:25 UTC | ±3 min |
| 2024-01-15T12:00:00Z | none | Mars ecliptic longitude | JPL Horizons order-of-magnitude ~267° | ~267° | ±2° |
| 2024-01-15T12:00:00Z | none | Jupiter ecliptic longitude | JPL Horizons band ~35° | ~35° | ±3° |

These checks are implemented in `src/astronomy/astronomy.test.ts` with fixed timestamps.

## Precision stance

PEx displays Astronomy Engine outputs for educational instrument use. This is **not** navigation-grade ephemeris. Observer-dependent values (rise/set, azimuth) require explicit user location and are labeled as location-dependent in the UI.

This pass shows **ecliptic longitude only** — not IAU constellation names (equal 30° zodiac sectors are not used).

## Manual references

- USNO Astronomical Applications (Moon phase, rise/set tables): https://aa.usno.navy.mil/
- JPL Horizons (planetary ephemeris spot checks): https://ssd.jpl.nasa.gov/horizons/

Investigate and document any test drift beyond tolerance before claiming stricter accuracy.
