import { loadCurriculumPacket } from "../content/load.ts";
import { affirmationTextFor } from "../content/participantLayer.ts";
import { isGoogleSyncConfigured } from "../sync/config.ts";
import { ensureCalendarAccessToken, insertPrimaryCalendarEvent } from "../sync/googleCalendar.ts";
import { loadGoogleIdentityState } from "../sync/googleAuth.ts";
import { signInGoogleAccount } from "../sync/syncEngine.ts";
import { statusBox } from "./bits.ts";
import { announce, el } from "./dom.ts";

function defaultEventTimes(dateValue: string, timeValue: string): { start: string; end: string } {
  const start = new Date(`${dateValue}T${timeValue}:00`);
  const end = new Date(start.getTime() + 15 * 60_000);
  const toLocalIso = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };
  return { start: toLocalIso(start), end: toLocalIso(end) };
}

export function calendarAffirmationPanel(day: number): HTMLElement | null {
  const document = loadCurriculumPacket().days.find((item) => item.day === day);
  if (!document) return null;
  const affirmation = affirmationTextFor(document);
  if (!affirmation) return null;

  const host = el("div", { class: "calendar-affirmation-panel", id: "calendar-affirmation-panel" });
  const reviewHost = el("div", { id: "calendar-affirmation-review" });
  const statusHost = el("div", { id: "calendar-affirmation-status" });

  const today = new Date();
  const dateDefault = today.toISOString().slice(0, 10);
  const timeDefault = "08:00";

  const openReview = () => {
    reviewHost.replaceChildren(
      el("h3", {}, ["Review before adding to Calendar"]),
      el("p", { class: "hint" }, [
        "Nothing is created until you confirm. One event only — this day’s affirmation.",
      ]),
      el("label", { for: "calendar-affirmation-text" }, ["Affirmation"]),
      (() => {
        const area = el("textarea", {
          id: "calendar-affirmation-text",
          rows: "3",
          readonly: true,
        }) as HTMLTextAreaElement;
        area.value = affirmation;
        return area;
      })(),
      el("label", { for: "calendar-affirmation-date" }, ["Date"]),
      el("input", {
        type: "date",
        id: "calendar-affirmation-date",
        value: dateDefault,
      }),
      el("label", { for: "calendar-affirmation-time" }, ["Time"]),
      el("input", {
        type: "time",
        id: "calendar-affirmation-time",
        value: timeDefault,
      }),
      el("div", { class: "actions" }, [
        el("button", { type: "button", class: "primary", id: "calendar-affirmation-confirm" }, [
          "Add to Google Calendar",
        ]),
        el("button", { type: "button", id: "calendar-affirmation-cancel" }, ["Cancel"]),
      ]),
    );
    reviewHost.querySelector("#calendar-affirmation-cancel")?.addEventListener("click", () => {
      reviewHost.replaceChildren();
      announce("Calendar review closed");
    });
    reviewHost.querySelector("#calendar-affirmation-confirm")?.addEventListener("click", () => {
      void (async () => {
        const dateInput = reviewHost.querySelector("#calendar-affirmation-date") as HTMLInputElement;
        const timeInput = reviewHost.querySelector("#calendar-affirmation-time") as HTMLInputElement;
        const text = affirmation;
        if (!dateInput.value || !timeInput.value) {
          statusHost.replaceChildren(statusBox("error", "Missing date or time", "Choose when the reminder should appear."));
          return;
        }
        statusHost.replaceChildren(statusBox("info", "Adding event…", "Google Calendar permission is requested only for this action."));
        try {
          const token = await ensureCalendarAccessToken();
          const { start, end } = defaultEventTimes(dateInput.value, timeInput.value);
          await insertPrimaryCalendarEvent(token, {
            summary: `Psychical Excursion · Day ${day} affirmation`,
            description: text,
            startLocalIso: start,
            endLocalIso: end,
          });
          statusHost.replaceChildren(
            statusBox("ok", "Added to Google Calendar", "One event was created with the affirmation you reviewed."),
          );
          reviewHost.replaceChildren();
          announce("Affirmation added to Google Calendar");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Could not add event";
          statusHost.replaceChildren(
            statusBox("error", "Calendar event not created", `${message}. The guide on this device is unchanged.`),
          );
        }
      })();
    });
  };

  const trigger = el("button", {
    type: "button",
    class: "button quiet calendar-affirmation-open",
    id: "calendar-affirmation-open",
  }, ["Add today's affirmation to Google Calendar"]);
  trigger.addEventListener("click", () => {
    void (async () => {
      statusHost.replaceChildren();
      if (!isGoogleSyncConfigured()) {
        statusHost.replaceChildren(
          statusBox("info", "Calendar not available here", "This copy of the site does not have Google Calendar connected."),
        );
        return;
      }
      const identity = await loadGoogleIdentityState();
      if (!identity.signedIn) {
        statusHost.replaceChildren(
          statusBox("info", "Sign in to continue", "Google sign-in is needed before Calendar access. Drive backup stays separate."),
        );
        try {
          await signInGoogleAccount();
        } catch {
          statusHost.replaceChildren(
            statusBox("error", "Sign-in did not finish", "You can keep reading this day without Calendar."),
          );
          return;
        }
      }
      openReview();
    })();
  });

  host.append(trigger, reviewHost, statusHost);
  return host;
}
