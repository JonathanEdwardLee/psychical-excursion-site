import { isEntryType, type EntryType } from "../domain/types.ts";

export type AppRoute =
  | { name: "home" }
  | { name: "today" }
  | { name: "days" }
  | { name: "day"; day: number }
  | { name: "phase"; phaseId: string }
  | { name: "week"; week: number }
  | { name: "capture"; variant: "standard" | "night"; presetType?: EntryType }
  | { name: "journal" }
  | { name: "entry"; id: string }
  | { name: "method" }
  | { name: "about" }
  | { name: "data" }
  | { name: "account" }
  | { name: "astronomy" }
  | { name: "unknown"; path: string };

function parseCaptureRoute(parts: string[]): Extract<AppRoute, { name: "capture" }> {
  const variant = parts[1] === "night" ? "night" : "standard";
  const typePart = variant === "night" ? parts[2] : parts[1];
  const presetType = typePart && isEntryType(typePart) ? typePart : undefined;
  return { name: "capture", variant, presetType };
}

export function parseRoute(hash = window.location.hash): AppRoute {
  const raw = hash.replace(/^#/, "") || "/";
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  const parts = path.split("/").filter(Boolean);
  const section = parts[0];
  if (!section) return { name: "home" };
  if (section === "today") return { name: "today" };
  if (section === "capture") return parseCaptureRoute(parts);
  if (section === "method") return { name: "method" };
  if (section === "about") return { name: "about" };
  if (section === "data") return { name: "data" };
  if (section === "account") return { name: "account" };
  if (section === "astronomy") return { name: "astronomy" };
  if (section === "journal" && parts[1]) return { name: "entry", id: parts[1] };
  if (section === "journal") return { name: "journal" };
  if (section === "days" && parts[1]) {
    const day = Number(parts[1]);
    return { name: "day", day };
  }
  if (section === "days") return { name: "days" };
  if (section === "day" && parts[1]) {
    const day = Number(parts[1]);
    return { name: "day", day };
  }
  if ((section === "week" || section === "weeks") && parts[1]) {
    const week = Number(parts[1]);
    return { name: "week", week };
  }
  if ((section === "phase" || section === "phases") && parts[1]) {
    return { name: "phase", phaseId: parts[1] };
  }
  return { name: "unknown", path };
}

export function routeNavKey(route: AppRoute): string {
  if (route.name === "home") return "home";
  if (
    route.name === "today" ||
    route.name === "day" ||
    route.name === "days" ||
    route.name === "phase" ||
    route.name === "week"
  ) {
    return "days";
  }
  if (route.name === "capture") return "journal";
  if (route.name === "journal" || route.name === "entry") return "journal";
  if (route.name === "method") return "method";
  if (route.name === "about") return "about";
  if (route.name === "data") return "data";
  if (route.name === "account") return "account";
  if (route.name === "astronomy") return "astronomy";
  return "";
}
