import { computeAstronomySnapshot, type AstronomySnapshot, type ObserverLocation } from "./compute.ts";

export function snapshotAt(at: Date, location?: ObserverLocation | null): AstronomySnapshot {
  return computeAstronomySnapshot(at, location);
}

export function updateCadenceMs(reducedMotion: boolean): number {
  return reducedMotion ? 120_000 : 60_000;
}
