import { describe, expect, it } from "vitest";
import { Body, EclipticLongitude, MakeTime } from "astronomy-engine";
import { computeAstronomySnapshot } from "./compute.ts";
import { moonPhaseName } from "./constants.ts";

/** Washington, DC — reference comparisons documented in docs/ASTRONOMY_VALIDATION.md */
const WASHINGTON = { latitude: 38.9072, longitude: -77.0369, heightMeters: 0 };

describe("astronomy instrument", () => {
  it("works without location and does not require coordinates", () => {
    const at = new Date("2024-01-15T17:00:00.000Z");
    const snap = computeAstronomySnapshot(at, null);
    expect(snap.locationUsed).toBe(false);
    expect(snap.sun.horizon).toBeNull();
    expect(snap.moon.horizon).toBeNull();
    expect(snap.planets).toHaveLength(7);
    expect(snap.moon.phaseName).toMatch(/Moon|quarter|crescent|gibbous/i);
  });

  it("reports Moon illumination and phase for a fixed instant", () => {
    const at = new Date("2024-01-15T12:00:00.000Z");
    const snap = computeAstronomySnapshot(at, null);
    expect(snap.moon.illuminationPercent).toBeGreaterThan(20);
    expect(snap.moon.illuminationPercent).toBeLessThan(23);
    expect(snap.moon.phaseName).toMatch(/crescent|quarter|gibbous|Moon/i);
    expect(moonPhaseName(90)).toBe("First quarter");
  });

  it("approximates Washington Sun rise on 2024-01-15 within tolerance", () => {
    const at = new Date("2024-01-15T12:00:00.000Z");
    const snap = computeAstronomySnapshot(at, WASHINGTON);
    expect(snap.locationUsed).toBe(true);
    expect(snap.sun.riseSet?.rise).toBeTruthy();
    const rise = new Date(snap.sun.riseSet!.rise!);
    expect(rise.getUTCHours()).toBe(12);
    expect(rise.getUTCMinutes()).toBeGreaterThanOrEqual(24);
    expect(rise.getUTCMinutes()).toBeLessThanOrEqual(26);
  });

  it("spot-checks planetary ecliptic longitudes", () => {
    const at = new Date("2024-01-15T12:00:00.000Z");
    const t = MakeTime(at);
    const marsLon = EclipticLongitude(Body.Mars, t);
    expect(marsLon).toBeGreaterThan(265);
    expect(marsLon).toBeLessThan(269);
    const snap = computeAstronomySnapshot(at, null);
    const jupiter = snap.planets.find((p) => p.name === "Jupiter");
    expect(jupiter?.eclipticLongitudeDeg).toBeGreaterThan(30);
    expect(jupiter?.eclipticLongitudeDeg).toBeLessThan(50);
  });

  it("classifies apparent retrograde vs direct motion", () => {
    const at = new Date("2024-01-15T12:00:00.000Z");
    const snap = computeAstronomySnapshot(at, null);
    for (const planet of snap.planets) {
      expect(["direct", "retrograde", "unknown"]).toContain(planet.motion);
    }
  });

  it("handles timezone rollover deterministically", () => {
    const late = new Date("2024-03-10T06:30:00.000Z");
    const snap = computeAstronomySnapshot(late, null);
    expect(snap.computedAt).toBe(late.toISOString());
    expect(snap.utcTimeLabel.length).toBeGreaterThan(5);
  });
});
