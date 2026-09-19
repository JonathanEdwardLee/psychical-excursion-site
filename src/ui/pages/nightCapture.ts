import { AudioCapture } from "../../audio/recorder.ts";
import { ENTRY_TYPE_LABEL, type EntryType } from "../../domain/types.ts";
import {
  capture,
  initRecorderFlags,
  microphoneBusy,
  persistNightStopToJournal,
} from "../captureSession.ts";
import { loadCapturePracticeContext } from "../captureContext.ts";
import { statusBox } from "../bits.ts";
import { announce, el, formatWhen } from "../dom.ts";
import { padDay } from "../motif.ts";
import type { AppRoute } from "../routes.ts";

function formatTimer(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export async function renderNightCapturePage(
  main: HTMLElement,
  route: Extract<AppRoute, { name: "capture" }>,
): Promise<void> {
  const capability = initRecorderFlags();
  const practice = await loadCapturePracticeContext();
  if (route.presetType) capture.type = route.presetType;
  else if (!capture.type) capture.type = "dream";

  const clock = el("p", { class: "night-clock", id: "night-clock" }, [formatWhen(Date.now())]);
  const context = el("p", { class: "meta night-context" }, [
    `Day ${padDay(practice.day)} · ${practice.phaseName}`,
  ]);
  const timer = el("p", { class: "night-timer meta", id: "night-timer" }, ["Ready"]);
  const typeLabel = el("p", { class: "night-type-label" }, [ENTRY_TYPE_LABEL[capture.type ?? "dream"]]);

  const recordBtn = el("button", {
    type: "button",
    id: "night-record-btn",
    class: "night-record-btn primary",
  }, [capture.recordingActive ? "Stop" : "Record"]);

  const statusHost = el("div", { id: "night-capture-status" });
  let timerHandle: ReturnType<typeof setInterval> | null = null;

  const stopTimer = () => {
    if (timerHandle) clearInterval(timerHandle);
    timerHandle = null;
  };

  const paintStatus = (pending?: string) => {
    statusHost.replaceChildren();
    if (pending) statusHost.append(statusBox("info", pending, "Local save runs before any optional sync."));
    if (capture.saveError) statusHost.append(statusBox("error", "Not saved", capture.saveError));
    if (capture.locallySafeEntryId) {
      statusHost.append(
        statusBox(
          "ok",
          "Locally safe",
          "IndexedDB confirmed this recording on this device. You can close PEx and reopen from Journal.",
        ),
        el("p", { class: "actions" }, [
          el("a", { href: `#/journal/${capture.locallySafeEntryId}`, class: "button primary" }, ["Open Journal entry"]),
          el("button", { type: "button", id: "night-record-more" }, ["Record another"]),
        ]),
      );
      statusHost.querySelector("#night-record-more")?.addEventListener("click", () => {
        capture.locallySafeEntryId = null;
        capture.saveError = null;
        paintStatus();
      });
    }
  };
  paintStatus();

  const syncChrome = () => {
    recordBtn.textContent = capture.recordingActive ? "Stop" : "Record";
    clock.textContent = formatWhen(Date.now());
    typeLabel.textContent = ENTRY_TYPE_LABEL[capture.type ?? "dream"];
    if (capture.recordingActive && capture.recordingStartedAt) {
      timer.textContent = `Recording ${formatTimer(Date.now() - capture.recordingStartedAt)}`;
    } else if (capture.locallySafeEntryId) {
      timer.textContent = "Saved locally";
    } else {
      timer.textContent = "Ready";
    }
  };

  clockHandle();
  function clockHandle() {
    syncChrome();
    requestAnimationFrame(() => {
      if (document.getElementById("night-record-btn")) {
        window.setTimeout(clockHandle, 30_000);
      }
    });
  }

  recordBtn.addEventListener("click", () => {
    void (async () => {
      if (capture.recordingActive) {
        try {
          const result = await capture.recorder?.stop();
          capture.recordingActive = false;
          capture.starting = false;
          stopTimer();
          if (result) {
            capture.recording = { blob: result.blob, mimeType: result.mimeType };
            capture.interrupted = result.interrupted;
          }
          paintStatus("Saving locally…");
          const entryId = await persistNightStopToJournal();
          paintStatus();
          syncChrome();
          if (entryId) announce("Recording locally safe");
        } catch (error) {
          capture.recordingActive = false;
          stopTimer();
          capture.saveError = error instanceof Error ? error.message : "Recording failed.";
          paintStatus();
          syncChrome();
        }
        return;
      }
      capture.saveError = null;
      capture.locallySafeEntryId = null;
      capture.starting = true;
      paintStatus("Waiting for microphone…");
      try {
        capture.recorder = new AudioCapture(capability);
        await capture.recorder.start();
        capture.starting = false;
        capture.recordingActive = true;
        capture.recordingStartedAt = Date.now();
        stopTimer();
        timerHandle = setInterval(syncChrome, 500);
        syncChrome();
        paintStatus();
      } catch (error) {
        capture.starting = false;
        capture.recorder?.release();
        capture.recorder = null;
        capture.saveError = error instanceof Error ? error.message : "Could not start recording.";
        paintStatus();
        syncChrome();
      }
    })();
  });

  const typeRow = el("div", { class: "night-type-row actions" });
  (["dream", "experience", "sensation"] as EntryType[]).forEach((type) => {
    const btn = el("button", {
      type: "button",
      class: capture.type === type ? "primary" : "",
    }, [ENTRY_TYPE_LABEL[type]]);
    btn.addEventListener("click", () => {
      if (microphoneBusy()) return;
      capture.type = type;
      typeLabel.textContent = ENTRY_TYPE_LABEL[type];
      typeRow.querySelectorAll("button").forEach((node) => node.classList.remove("primary"));
      btn.classList.add("primary");
    });
    typeRow.append(btn);
  });

  main.append(
    el("article", { class: "surface night-capture-surface" }, [
      el("p", { class: "eyebrow" }, ["Night capture"]),
      el("h2", { class: "display-title night-title" }, ["Capture"]),
      el("p", { class: "hint" }, ["Low light, local-first. Stop saves to this device before any optional sync."]),
      clock,
      context,
      typeLabel,
      timer,
      recordBtn,
      typeRow,
      el("p", { class: "hint" }, [
        el("a", { href: "#/capture", class: "text-link" }, ["Standard capture"]),
        " · ",
        el("a", { href: "#/journal", class: "text-link" }, ["Journal"]),
      ]),
      statusHost,
    ]),
  );
}
