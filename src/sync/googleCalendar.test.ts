import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CALENDAR_EVENTS_SCOPE } from "../domain/sync.ts";
import { setGoogleApiFetchForTests } from "./googleApiClient.ts";
import { calendarScopeLabel, insertPrimaryCalendarEvent } from "./googleCalendar.ts";

describe("google calendar affirmation flow", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    setGoogleApiFetchForTests(null);
  });

  it("uses the calendar.events scope label", () => {
    expect(calendarScopeLabel()).toBe(CALENDAR_EVENTS_SCOPE);
  });

  it("does not insert until insertPrimaryCalendarEvent is called explicitly", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    setGoogleApiFetchForTests(fetchSpy as typeof fetch);
    await insertPrimaryCalendarEvent("fixture-token", {
      summary: "Psychical Excursion · Day 1 affirmation",
      description: "I remember my dreams when I wake.",
      startLocalIso: "2026-09-20T08:00:00",
      endLocalIso: "2026-09-20T08:15:00",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toMatch(/calendar\/v3\/calendars\/primary\/events/);
  });
});
