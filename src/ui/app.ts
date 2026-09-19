import { AudioCapture, inspectRecorderCapability } from "../audio/recorder.ts";
import { localStore } from "../db/store.ts";
import { AppError, createId, type EntryType } from "../domain/types.ts";
import { buildJournalZip } from "../export/journalExport.ts";
import { inspectAndRequestPersistence, persistenceSummary } from "../storage/persistence.ts";
import { readTheme, toggleTheme } from "../theme.ts";
import { emptyJournal, entryCard, statusBox, typeFieldset } from "./bits.ts";
import { announce, el, formatWhen, go } from "./dom.ts";
import { renderDayPage, renderTodayPage } from "./pages/day.ts";
import { renderDaysPage, renderPhasePage } from "./pages/days.ts";
import { renderAboutPage, renderHomePage, renderMethodPage } from "./pages/home.ts";
import { parseRoute } from "./routes.ts";
import { bindDayReading, bindPhaseJourney, stopScrollPresence } from "./scrollPresence.ts";
import { renderChrome } from "./shell.ts";

type CaptureState = {
  type: EntryType | null;
  note: string;
  recording: { blob: Blob; mimeType: string } | null;
  recorder: AudioCapture | null;
  recordingActive: boolean;
  starting: boolean;
  permissionDenied: boolean;
  recorderUnavailable: boolean;
  mimeUnsupported: boolean;
  interrupted: boolean;
  saveError: string | null;
  saving: boolean;
};

const capture: CaptureState = {
  type: null,
  note: "",
  recording: null,
  recorder: null,
  recordingActive: false,
  starting: false,
  permissionDenied: false,
  recorderUnavailable: false,
  mimeUnsupported: false,
  interrupted: false,
  saveError: null,
  saving: false,
};

export function isCaptureMicrophoneHeld(): boolean {
  return capture.starting || capture.recordingActive || Boolean(capture.recorder?.isLive());
}

export function abandonLiveMicrophone(): void {
  capture.recorder?.release();
  capture.recorder = null;
  capture.recordingActive = false;
  capture.starting = false;
}

function resetCaptureMedia(): void {
  abandonLiveMicrophone();
  capture.recording = null;
  capture.interrupted = false;
}

function microphoneBusy(): boolean {
  return capture.starting || capture.recordingActive;
}

export async function renderApp(root: HTMLElement): Promise<void> {
  const route = parseRoute(window.location.hash.split("?")[0]);

  if (route.name !== "capture") {
    abandonLiveMicrophone();
  }

  stopScrollPresence();
  const { main } = renderChrome(root, route);

  try {
    if (route.name === "capture") await renderCapture(main);
    else if (route.name === "entry") await renderEntry(main, route.id);
    else if (route.name === "journal") await renderJournal(main);
    else if (route.name === "day") await renderDayPage(main, route.day);
    else if (route.name === "today") await renderTodayPage(main);
    else if (route.name === "days") await renderDaysPage(main);
    else if (route.name === "phase") await renderPhasePage(main, route.phaseId);
    else if (route.name === "data") await renderData(main);
    else if (route.name === "method") await renderMethodPage(main);
    else if (route.name === "about") await renderAboutPage(main);
    else if (route.name === "unknown") {
      main.append(
        el("section", { class: "editorial-page" }, [
          el("h2", { class: "display-title" }, ["Not found"]),
          statusBox("error", "Unknown route", "Use the primary navigation. Capture remains one step from Home."),
        ]),
      );
    }     else await renderHomePage(main);
  } catch (error) {
    main.append(renderFatal(error));
  }
  if (route.name === "days") bindPhaseJourney(root);
  if (route.name === "day" || route.name === "today") bindDayReading(root);
}

function renderFatal(error: unknown): HTMLElement {
  const message = error instanceof AppError ? error.message : "The local workspace could not be opened.";
  const wrap = el("section", {}, [
    el("h2", {}, ["Local storage problem"]),
    statusBox(
      "error",
      "Nothing was silently discarded",
      `${message} Text you typed on this screen is still in the form until you leave. Try again, or use another browser that supports IndexedDB.`,
    ),
  ]);
  return wrap;
}

async function renderCapture(main: HTMLElement): Promise<void> {
  const capability = inspectRecorderCapability();
  if (!capability.mediaRecorder || !capability.getUserMedia) capture.recorderUnavailable = true;
  if (capability.mediaRecorder && !capability.selectedMimeType) capture.mimeUnsupported = true;

  const heading = el("h2", { class: "display-title" }, ["Capture"]);
  const lede = el("p", { class: "lede" }, [
    "Record what you noticed during practice. Choose Dream, Experience, or Sensation, add text if you like, then save to your Journal on this device. Labels organize your notes — they are not interpretations. Microphone access is requested only when you tap Record.",
  ]);

  const form = el("form", { class: "stack", id: "capture-form" });
  form.addEventListener("submit", (event) => event.preventDefault());

  const types = typeFieldset(capture.type, (type) => {
    capture.type = type;
  });

  const noteId = "capture-note";
  const note = el("textarea", {
    id: noteId,
    name: "note",
    rows: "6",
    maxlength: "8000",
    "aria-describedby": "note-hint",
  }, []);
  note.value = capture.note;
  note.addEventListener("input", () => {
    capture.note = note.value;
  });

  const recordRow = el("div", { class: "actions" });
  const recordBtn = el("button", { type: "button", id: "record-btn", class: "primary" }, [
    capture.recordingActive ? "Stop" : "Record",
  ]);
  const saveBtn = el("button", { type: "button", id: "save-btn" }, ["Save to Journal"]);
  saveBtn.disabled = microphoneBusy();
  recordRow.append(recordBtn, saveBtn);

  const statusHost = el("div", { id: "capture-status" });
  const syncCaptureChrome = (pending?: string) => {
    recordBtn.textContent = capture.recordingActive ? "Stop" : "Record";
    saveBtn.textContent = "Save to Journal";
    const inReview = Boolean(capture.recording) && !capture.recordingActive && !microphoneBusy();
    saveBtn.classList.toggle("primary", inReview);
    saveBtn.disabled = microphoneBusy() || capture.saving;
    paintCaptureStatus(statusHost, capability, saveBtn, recordBtn, syncCaptureChrome, pending);
  };
  syncCaptureChrome();

  recordBtn.addEventListener("click", () => {
    void (async () => {
      if (capture.recordingActive) {
        try {
          const result = await capture.recorder?.stop();
          capture.recordingActive = false;
          capture.starting = false;
          saveBtn.disabled = false;
          recordBtn.textContent = "Record";
          if (result) {
            capture.recording = { blob: result.blob, mimeType: result.mimeType };
            capture.interrupted = result.interrupted;
          }
        } catch (error) {
          capture.recordingActive = false;
          capture.starting = false;
          capture.recorder?.release();
          capture.recorder = null;
          saveBtn.disabled = false;
          recordBtn.textContent = "Record";
          capture.saveError = error instanceof AppError ? error.message : "Recording failed. The microphone is off.";
        }
        syncCaptureChrome();
        return;
      }
      try {
        capture.saveError = null;
        capture.permissionDenied = false;
        capture.interrupted = false;
        capture.starting = true;
        saveBtn.disabled = true;
        syncCaptureChrome("Waiting for microphone permission…");
        capture.recorder = new AudioCapture(capability);
        await capture.recorder.start();
        if (capture.recorder === null) return;
        capture.starting = false;
        capture.recordingActive = true;
        saveBtn.disabled = true;
        recordBtn.textContent = "Stop";
        announce("Recording. The microphone is on.");
        syncCaptureChrome();
        return;
      } catch (error) {
        capture.starting = false;
        capture.recordingActive = false;
        capture.recorder?.release();
        capture.recorder = null;
        saveBtn.disabled = false;
        if (error instanceof AppError && error.code === "permission-denied") {
          capture.permissionDenied = true;
        } else if (error instanceof AppError && error.code === "mime-unsupported") {
          capture.mimeUnsupported = true;
        } else if (error instanceof AppError && error.code === "recorder-unsupported") {
          capture.recorderUnavailable = true;
        } else {
          capture.saveError = error instanceof AppError ? error.message : "Recording could not start.";
        }
      }
      syncCaptureChrome();
    })();
  });

  saveBtn.addEventListener("click", () => {
    void (async () => {
      if (capture.saving) return;
      if (microphoneBusy()) {
        saveBtn.disabled = true;
        capture.saveError = "Recording is still on. Stop first. The microphone has not been released.";
        syncCaptureChrome();
        return;
      }
      if (!capture.type) {
        capture.saveError = "Choose Dream, Experience, or Sensation before saving to the Journal.";
        syncCaptureChrome();
        return;
      }
      if (!capture.note.trim() && !capture.recording) {
        capture.saveError = "Add a short note or a recording before saving to the Journal.";
        syncCaptureChrome();
        return;
      }
      capture.saving = true;
      saveBtn.disabled = true;
      syncCaptureChrome("Saving to Journal…");
      try {
        const saved = await localStore.saveCapture({
          id: createId("entry"),
          type: capture.type,
          note: capture.note,
          createdAt: Date.now(),
          audio: capture.recording
            ? { id: createId("audio"), blob: capture.recording.blob, mimeType: capture.recording.mimeType }
            : null,
        });
        capture.saving = false;
        capture.note = "";
        resetCaptureMedia();
        announce("Saved locally");
        sessionStorage.setItem("pex-just-saved", saved.id);
        go(`/journal/${saved.id}`);
      } catch (error) {
        capture.saving = false;
        saveBtn.disabled = false;
        capture.saveError = error instanceof AppError ? error.message : "Save failed. The entry was not marked saved.";
        syncCaptureChrome();
      }
    })();
  });

  form.append(
    types,
    el("label", { for: noteId }, ["Text note (optional if you record)"]),
    note,
    el("p", { id: "note-hint", class: "hint" }, ["Notes never leave this browser in this build."]),
    recordRow,
    statusHost,
  );
  main.append(
    el("article", { class: "surface capture-surface" }, [heading, lede, form]),
  );
}

function discardUnsavedRecording(repaint: () => void): void {
  resetCaptureMedia();
  capture.saveError = null;
  announce("Unsaved recording discarded. The microphone is off.");
  repaint();
}

function paintCaptureStatus(
  host: HTMLElement,
  capability: ReturnType<typeof inspectRecorderCapability>,
  saveBtn: HTMLButtonElement,
  recordBtn: HTMLButtonElement,
  repaint: (pending?: string) => void,
  pending?: string,
): void {
  host.replaceChildren();
  const inReview = Boolean(capture.recording) && !capture.recordingActive && !microphoneBusy();

  if (capture.recordingActive) {
    host.append(
      statusBox(
        "info",
        "Recording",
        "The microphone is on. Stop to review your recording, then save it to the Journal or discard it. Leaving Capture turns the microphone off.",
      ),
    );
  }
  if (pending) {
    host.append(
      statusBox(
        "info",
        pending,
        inReview || capture.recording
          ? "Nothing is in the Journal until IndexedDB confirms Save to Journal."
          : "Choose a type and add text or a recording, then save to the Journal.",
      ),
    );
    if (!capture.recordingActive && !inReview) return;
  }
  if (capture.saveError) host.append(statusBox("error", "Not saved", capture.saveError));
  if (capture.permissionDenied) {
    host.append(
      statusBox(
        "info",
        "Microphone not available",
        "Permission was denied. This is not a loop: Record will only ask again if you tap it. Text notes still save to the Journal.",
      ),
    );
  }
  if (capture.recorderUnavailable) {
    host.append(
      statusBox(
        "info",
        "Recording unavailable",
        "MediaRecorder or getUserMedia is missing. Use a text note and Save to Journal.",
      ),
    );
  }
  if (capture.mimeUnsupported) {
    host.append(
      statusBox("info", "No supported recording format", "The browser reported no usable MIME type. Use a text note."),
    );
  }
  if (capture.interrupted) {
    host.append(statusBox("info", "Recording interrupted", "You can replay what was captured if any audio arrived, or record again."));
  }
  if (inReview && capture.recording) {
    host.append(
      statusBox(
        "info",
        "Not saved yet",
        "Replay your recording below. It is not in the Journal until you tap Save to Journal. Discard or record again without leaving stale microphone access.",
      ),
    );
    const player = el("audio", { controls: "true", id: "capture-review-audio" }) as HTMLAudioElement;
    player.src = URL.createObjectURL(capture.recording.blob);
    host.append(el("p", { class: "meta" }, [`Unsaved recording · ${capture.recording.mimeType}`]), player);
    const reviewActions = el("div", { class: "actions capture-review-actions" });
    const reviewSave = el("button", { type: "button", class: "primary", id: "review-save-btn" }, ["Save to Journal"]);
    reviewSave.addEventListener("click", () => saveBtn.click());
    const recordAgain = el("button", { type: "button", id: "record-again-btn" }, ["Record again"]);
    recordAgain.addEventListener("click", () => {
      discardUnsavedRecording(repaint);
      recordBtn.click();
    });
    const discard = el("button", { type: "button", class: "danger" }, ["Discard recording"]);
    discard.addEventListener("click", () => discardUnsavedRecording(repaint));
    reviewActions.append(reviewSave, recordAgain, discard);
    host.append(reviewActions);
  }
  if (!inReview) {
    host.append(
      el("p", { class: "hint" }, [
        capability.selectedMimeType
          ? `Recordings stay on this device. Save to Journal writes to IndexedDB; the Journal is where you replay and export later.`
          : "This browser did not report a usable recording format. Text notes still save to the Journal after IndexedDB confirms.",
      ]),
    );
  }
}

async function renderJournal(main: HTMLElement): Promise<void> {
  const entries = await localStore.listEntries();
  const list = el("div", { class: "stack" });
  if (entries.length === 0) list.append(emptyJournal());
  else entries.forEach((entry) => list.append(entryCard(entry)));
  main.append(
    el("section", { class: "journal-surface" }, [
      el("p", { class: "eyebrow" }, ["On this device"]),
      el("h2", { class: "display-title" }, ["Journal"]),
      el("p", { class: "lede" }, ["Chronological local entries. Newest first. Replay and delete live only on this device."]),
      list,
    ]),
  );
}

async function renderEntry(main: HTMLElement, id: string): Promise<void> {
  const savedFlag = sessionStorage.getItem("pex-just-saved") === id;
  if (savedFlag) sessionStorage.removeItem("pex-just-saved");
  const found = await localStore.getEntry(id);
  if (!found) {
    main.append(el("h2", {}, ["Entry"]), statusBox("error", "Not found", "That entry is not in local storage on this device."));
    return;
  }
  const { entry, media } = found;
  const heading = el("h2", { class: "display-title" }, ["Entry"]);
  const meta = el("p", { class: "meta" }, [
    `${entry.type} · `,
    el("time", { datetime: new Date(entry.createdAt).toISOString() }, [formatWhen(entry.createdAt)]),
  ]);
  const note = el("textarea", { id: "entry-note", rows: "6" });
  note.value = entry.note;
  const saveNote = el("button", { type: "button" }, ["Save note"]);
  const noteStatus = el("div");
  saveNote.addEventListener("click", () => {
    void (async () => {
      try {
        await localStore.updateNote(entry.id, note.value);
        noteStatus.replaceChildren(statusBox("ok", "Saved", "The note update was confirmed in IndexedDB."));
        announce("Note saved");
      } catch (error) {
        noteStatus.replaceChildren(
          statusBox("error", "Note not updated", error instanceof AppError ? error.message : "Save failed."),
        );
      }
    })();
  });

  const mediaBlock = el("div");
  if (media) {
    const player = el("audio", { controls: "true", id: "entry-audio" }) as HTMLAudioElement;
    player.src = URL.createObjectURL(media.blob);
    mediaBlock.append(
      el("p", { class: "meta" }, [`Journal recording · ${media.mimeType} · stored on this device only`]),
      player,
    );
  }

  const deleteHost = el("div");
  const deleteBtn = el("button", { type: "button", class: "danger" }, ["Delete"]);
  deleteBtn.addEventListener("click", () => {
    deleteHost.replaceChildren(
      el("div", { class: "confirm", role: "group", "aria-label": "Confirm deletion" }, [
        el("p", {}, ["Delete this entry and its local recording from this browser? This app cannot restore it. Export first if you need a copy."]),
        (() => {
          const yes = el("button", { type: "button", class: "danger" }, ["Delete permanently"]);
          const no = el("button", { type: "button" }, ["Keep entry"]);
          yes.addEventListener("click", () => {
            void (async () => {
              try {
                await localStore.deleteEntry(entry.id);
                announce("Deleted");
                go("/journal");
              } catch (error) {
                deleteHost.replaceChildren(
                  statusBox("error", "Still present", error instanceof AppError ? error.message : "Delete failed."),
                );
              }
            })();
          });
          no.addEventListener("click", () => {
            deleteHost.replaceChildren(deleteBtn);
          });
          return el("div", { class: "actions" }, [yes, no]);
        })(),
      ]),
    );
  });
  deleteHost.append(deleteBtn);

  main.append(
    el("p", { class: "eyebrow" }, ["Journal entry"]),
    heading,
    savedFlag
      ? statusBox(
          "ok",
          "Saved to Journal",
          "IndexedDB confirmed the write on this device. Replay the recording below or return to the Journal list. This is not a cloud backup.",
        )
      : el("span"),
    meta,
    el("label", { for: "entry-note" }, ["Text note"]),
    note,
    saveNote,
    noteStatus,
    mediaBlock,
    deleteHost,
    el("p", {}, [el("a", { href: "#/journal" }, ["Back to journal"])]),
  );
}

async function renderData(main: HTMLElement): Promise<void> {
  const existing = await localStore.loadPersistenceReport();
  const host = el("div", { id: "persist-status" });
  const paint = (report: typeof existing) => {
    const summary = persistenceSummary(report);
    host.replaceChildren(
      statusBox(summary.granted ? "ok" : "info", summary.headline, summary.detail),
      report
        ? el("ul", { class: "plain" }, [
            el("li", {}, [`persist API present: ${String(report.persistApiPresent)}`]),
            el("li", {}, [`persist() attempted: ${String(report.persistRequestAttempted)}`]),
            el("li", {}, [`persist granted (actual): ${String(report.persistGranted)}`]),
            el("li", {}, [
              `usage/quota: ${report.estimateUsageBytes ?? "unknown"} / ${report.estimateQuotaBytes ?? "unknown"}`,
            ]),
          ])
        : el("p", {}, ["No persistence probe stored yet."]),
    );
  };
  paint(existing);

  const probeBtn = el("button", { type: "button" }, ["Check storage persistence"]);
  probeBtn.addEventListener("click", () => {
    void inspectAndRequestPersistence().then((report) => {
      paint(report);
      announce(persistenceSummary(report).headline);
    });
  });

  const exportStatus = el("div");
  const exportBtn = el("button", { type: "button", class: "primary" }, ["Export journal"]);
  exportBtn.addEventListener("click", () => {
    void (async () => {
      try {
        const bundle = await localStore.exportBundle();
        const zip = await buildJournalZip(bundle.entries, bundle.media);
        const copy = new ArrayBuffer(zip.bytes.byteLength);
        new Uint8Array(copy).set(zip.bytes);
        const blob = new Blob([copy], { type: "application/zip" });
        const url = URL.createObjectURL(blob);
        const link = el("a", { href: url, download: zip.filename }, [zip.filename]);
        link.click();
        URL.revokeObjectURL(url);
        exportStatus.replaceChildren(
          statusBox(
            "ok",
            "Export prepared",
            `ZIP with ${zip.manifest.entryCount} entries and ${zip.manifest.recordingCount} recordings. This file is for you to keep. It is not uploaded.`,
          ),
        );
      } catch (error) {
        exportStatus.replaceChildren(
          statusBox("error", "Export failed", error instanceof Error ? error.message : "Could not export."),
        );
      }
    })();
  });

  const themeBtn = el("button", { type: "button", id: "theme-toggle" }, [
    readTheme() === "bedtime" ? "Use light" : "Use bedtime mode",
  ]);
  themeBtn.addEventListener("click", () => {
    const mode = toggleTheme();
    themeBtn.textContent = mode === "bedtime" ? "Use light" : "Use bedtime mode";
    const headerBtn = document.getElementById("theme-toggle-header");
    if (headerBtn) {
      const bedtime = mode === "bedtime";
      headerBtn.textContent = bedtime ? "Light" : "Bedtime";
      headerBtn.setAttribute("aria-pressed", bedtime ? "true" : "false");
      headerBtn.setAttribute("aria-label", bedtime ? "Switch to light" : "Switch to bedtime mode");
    }
  });

  const schema = await localStore.getSchemaInfo();

  main.append(
    el("section", { class: "stack editorial-page" }, [
      el("p", { class: "eyebrow" }, ["Local storage"]),
      el("h2", { class: "display-title" }, ["Data on this device"]),
      el("p", { class: "lede" }, [
        "Journal text, recordings, and progress live in this browser on this device. They are not sent to a server in this architecture. They are not cloud backed up. Browser or device data may be lost. Export is the recovery mechanism in this phase.",
      ]),
      host,
      probeBtn,
      el("h3", {}, ["Export"]),
      el("p", {}, [
        "A ZIP archive with manifest.json, journal.json, and recordings/. Format version 1, store-only ZIP. See docs/ENGINEERING.md.",
      ]),
      exportBtn,
      exportStatus,
      el("h3", {}, ["Appearance"]),
      el("p", {}, ["Light is the default. Bedtime mode is a quieter dark surface. The choice is stored locally."]),
      themeBtn,
      el("h3", {}, ["Offline"]),
      el("p", {}, [
        "After a successful load of the installed or cached application shell, reload can work offline. A first visit without a completed load is not claimed to work offline.",
      ]),
      el("p", { class: "meta" }, [
        `App ${schema?.appVersion ?? "unknown"} · schema ${schema?.schemaVersion ?? "unknown"}`,
      ]),
    ]),
  );
}

