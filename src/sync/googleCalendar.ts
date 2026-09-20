import { CALENDAR_EVENTS_SCOPE } from "../domain/sync.ts";
import { googleApiFetch } from "./googleApiClient.ts";
import { loadGoogleIdentityState, requestGoogleAccessToken } from "./googleAuth.ts";
import {
  readCalendarAccessToken,
  writeCalendarAccessToken,
  type StoredAccessToken,
} from "./googleTokens.ts";

export type CalendarEventDraft = {
  summary: string;
  description: string;
  startLocalIso: string;
  endLocalIso: string;
};

export async function ensureCalendarAccessToken(): Promise<string> {
  const cached = readCalendarAccessToken();
  if (cached) return cached.accessToken;
  const identity = await loadGoogleIdentityState();
  if (!identity.signedIn) throw new Error("sign-in-required");
  const token = await requestGoogleAccessToken(CALENDAR_EVENTS_SCOPE, "consent");
  writeCalendarAccessToken(token);
  return token.accessToken;
}

export async function insertPrimaryCalendarEvent(
  accessToken: string,
  draft: CalendarEventDraft,
): Promise<void> {
  const body = {
    summary: draft.summary,
    description: draft.description,
    start: { dateTime: draft.startLocalIso },
    end: { dateTime: draft.endLocalIso },
  };
  const response = await googleApiFetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) throw new Error("calendar-insert-failed");
}

export function calendarScopeLabel(): string {
  return CALENDAR_EVENTS_SCOPE;
}

export function readCachedCalendarToken(): StoredAccessToken | null {
  return readCalendarAccessToken();
}
