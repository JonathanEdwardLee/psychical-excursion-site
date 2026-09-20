import { describe, expect, it } from "vitest";
import { parseRoute, routeNavKey } from "./routes.ts";

describe("hash routes", () => {
  it("maps required product surfaces", () => {
    expect(parseRoute("#/")).toEqual({ name: "home" });
    expect(parseRoute("#/today")).toEqual({ name: "today" });
    expect(parseRoute("#/days")).toEqual({ name: "days" });
    expect(parseRoute("#/day/1")).toEqual({ name: "day", day: 1 });
    expect(parseRoute("#/day/60")).toEqual({ name: "day", day: 60 });
    expect(parseRoute("#/days/12")).toEqual({ name: "day", day: 12 });
    expect(parseRoute("#/phase/remember")).toEqual({ name: "phase", phaseId: "remember" });
    expect(parseRoute("#/week/3")).toEqual({ name: "week", week: 3 });
    expect(parseRoute("#/capture")).toEqual({ name: "capture", variant: "standard" });
    expect(parseRoute("#/capture/night/dream")).toEqual({
      name: "capture",
      variant: "night",
      presetType: "dream",
    });
    expect(parseRoute("#/account")).toEqual({ name: "account" });
    expect(parseRoute("#/astronomy")).toEqual({ name: "astronomy" });
    expect(parseRoute("#/journal")).toEqual({ name: "journal" });
    expect(parseRoute("#/journal/entry-1")).toEqual({ name: "entry", id: "entry-1" });
    expect(parseRoute("#/method")).toEqual({ name: "method" });
    expect(parseRoute("#/about")).toEqual({ name: "about" });
    expect(parseRoute("#/data")).toEqual({ name: "data" });
  });

  it("maps capture routes to Dream Journal nav key", () => {
    expect(routeNavKey(parseRoute("#/capture"))).toBe("journal");
    expect(routeNavKey(parseRoute("#/today"))).toBe("days");
  });
});
