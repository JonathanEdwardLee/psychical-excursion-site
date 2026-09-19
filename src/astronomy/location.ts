import type { ObserverLocation } from "./compute.ts";

const SESSION_KEY = "pex-astronomy-observer";

export function readSessionObserver(): ObserverLocation | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ObserverLocation;
    if (!Number.isFinite(parsed.latitude) || !Number.isFinite(parsed.longitude)) return null;
    return {
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      heightMeters: Number.isFinite(parsed.heightMeters) ? parsed.heightMeters : 0,
    };
  } catch {
    return null;
  }
}

export function writeSessionObserver(location: ObserverLocation): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(location));
}

export function clearSessionObserver(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export type GeolocationResult =
  | { ok: true; location: ObserverLocation }
  | { ok: false; code: "unsupported" | "denied" | "unavailable" | "timeout" | "error" };

export function requestDeviceLocation(timeoutMs = 12_000): Promise<GeolocationResult> {
  if (!("geolocation" in navigator)) {
    return Promise.resolve({ ok: false, code: "unsupported" });
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          ok: true,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heightMeters: position.coords.altitude ?? 0,
          },
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) resolve({ ok: false, code: "denied" });
        else if (error.code === error.POSITION_UNAVAILABLE) resolve({ ok: false, code: "unavailable" });
        else if (error.code === error.TIMEOUT) resolve({ ok: false, code: "timeout" });
        else resolve({ ok: false, code: "error" });
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: timeoutMs },
    );
  });
}
