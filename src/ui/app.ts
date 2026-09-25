import { trackPublicGuidebookPageView } from "../analytics/ga4.ts";
import { AudioCapture } from "../audio/recorder.ts";
import { localStore } from "../db/store.ts";
import { AppError, ENTRY_TYPE_LABEL } from "../domain/types.ts";
import { buildJournalZip } from "../export/journalExport.ts";
import { inspectAndRequestPersistence, persistenceSummary } from "../storage/persistence.ts";
import { readTheme, toggleTheme } from "../theme.ts";
import {
  abandonLiveMicrophone,
  capture,
  commitCaptureToJournal,
  initRecorderFlags,
  microphoneBusy,
  resetCaptureMedia,
} from "./captureSession.ts";
import { loadCapturePracticeContext } from "./captureContext.ts";
import { personalToolsUnlocked } from "./personalTools.ts";
import { signedOutPersonalToolsGate } from "./personalToolsGate.ts";
import { emptyJournal, entryCard, statusBox, syncStateLabel, typeFieldset } from "./bits.ts";
import { announce, el, formatWhen, go, text } from "./dom.ts";
import { renderAccountPage } from "./pages/account.ts";
import { renderDayPage, renderTodayPage } from "./pages/day.ts";
import { renderDaysPage, renderPhasePage, renderWeekPage } from "./pages/days.ts";
import { renderAstronomyPage, stopAstronomyClock } from "./pages/astronomy.ts";
import { renderAboutPage, renderHomePage, renderMethodPage } from "./pages/home.ts";
import { renderGuidebookHome } from "./pages/guidebookHome.ts";
import { renderGuidebookLanding } from "./pages/guidebookLanding.ts";
import { renderGuidebookChapterPage } from "./pages/guidebookChapter.ts";
import { loadGuidebookChapter01, CHAPTER_01_HASH, CHAPTER_01_TITLE } from "../content/guidebookChapter01.ts";
import { CHAPTER_02_HASH, CHAPTER_02_TITLE, loadGuidebookChapter02 } from "../content/guidebookChapter02.ts";
import { CHAPTER_03_HASH, CHAPTER_03_TITLE, loadGuidebookChapter03 } from "../content/guidebookChapter03.ts";
import { CHAPTER_04_HASH, CHAPTER_04_TITLE, loadGuidebookChapter04 } from "../content/guidebookChapter04.ts";
import {
  CHAPTER_05_HASH,
  CHAPTER_05_TITLE,
  isGuidebookChapter05Ready,
  loadGuidebookChapter05,
} from "../content/guidebookChapter05.ts";
import { CHAPTER_06_HASH, CHAPTER_06_TITLE, loadGuidebookChapter06 } from "../content/guidebookChapter06.ts";
import { CHAPTER_07_HASH, CHAPTER_07_TITLE, loadGuidebookChapter07 } from "../content/guidebookChapter07.ts";
import { CHAPTER_08_HASH, CHAPTER_08_TITLE, loadGuidebookChapter08 } from "../content/guidebookChapter08.ts";
import { CHAPTER_09_HASH, CHAPTER_09_TITLE, loadGuidebookChapter09 } from "../content/guidebookChapter09.ts";
import { CHAPTER_10_HASH, CHAPTER_10_TITLE, loadGuidebookChapter10 } from "../content/guidebookChapter10.ts";
import { CHAPTER_11_HASH, CHAPTER_11_TITLE, loadGuidebookChapter11 } from "../content/guidebookChapter11.ts";
import { CHAPTER_12_HASH, CHAPTER_12_TITLE, loadGuidebookChapter12 } from "../content/guidebookChapter12.ts";
import { CHAPTER_13_HASH, CHAPTER_13_TITLE, loadGuidebookChapter13 } from "../content/guidebookChapter13.ts";
import { CHAPTER_14_HASH, CHAPTER_14_TITLE, loadGuidebookChapter14 } from "../content/guidebookChapter14.ts";
import { CHAPTER_15_HASH, CHAPTER_15_TITLE, loadGuidebookChapter15 } from "../content/guidebookChapter15.ts";
import { CHAPTER_16_HASH, CHAPTER_16_TITLE, loadGuidebookChapter16 } from "../content/guidebookChapter16.ts";
import { CHAPTER_17_HASH, CHAPTER_17_TITLE, loadGuidebookChapter17 } from "../content/guidebookChapter17.ts";
import { CHAPTER_18_HASH, CHAPTER_18_TITLE, loadGuidebookChapter18 } from "../content/guidebookChapter18.ts";
import { CHAPTER_19_HASH, CHAPTER_19_TITLE, loadGuidebookChapter19 } from "../content/guidebookChapter19.ts";
import { CHAPTER_20_HASH, CHAPTER_20_TITLE, loadGuidebookChapter20 } from "../content/guidebookChapter20.ts";
import { CHAPTER_21_HASH, CHAPTER_21_TITLE, loadGuidebookChapter21 } from "../content/guidebookChapter21.ts";
import { CHAPTER_22_HASH, CHAPTER_22_TITLE, loadGuidebookChapter22 } from "../content/guidebookChapter22.ts";
import { finalizeGuidebookPage, renderGuidebookChrome } from "./guidebookShell.ts";
import { isGuidebookPublicSurface } from "./publicSurface.ts";
import { INTRODUCTION_PATH } from "../content/guidebookCatalog.ts";
import {
  applyGuidebookLocation,
  guidebookPageChanged,
  inPageGuidebookFragment,
  markGuidebookPage,
  parseGuidebookPublicPage,
  resetGuidebookWindowScroll,
  scrollGuidebookSection,
} from "./guidebookRoute.ts";
import { bindGuidebookReveals, stopGuidebookMotion } from "./guidebookMotion.ts";
import { renderNightCapturePage } from "./pages/nightCapture.ts";
import { parseRoute, type AppRoute } from "./routes.ts";
import { bindDayReading, bindPhaseJourney, stopScrollPresence } from "./scrollPresence.ts";
import { renderChrome } from "./shell.ts";

export { abandonLiveMicrophone, isCaptureMicrophoneHeld } from "./captureSession.ts";

function applyCaptureRouteTheme(route: AppRoute): void {
  if (route.name === "capture" && route.variant === "night") {
    document.documentElement.dataset.captureMode = "night";
  } else {
    delete document.documentElement.dataset.captureMode;
  }
}

export async function renderApp(root: HTMLElement): Promise<void> {
  if (isGuidebookPublicSurface()) {
    if (applyGuidebookLocation()) return;
    abandonLiveMicrophone();
    stopAstronomyClock();
    stopScrollPresence();
    stopGuidebookMotion();
    const page = parseGuidebookPublicPage();
    const fragment = inPageGuidebookFragment();
    const pageChanged = guidebookPageChanged(page);
    if (pageChanged && !fragment) resetGuidebookWindowScroll();
    markGuidebookPage(page);
    const { main } = renderGuidebookChrome(root, page);
    const previousHome = {
      href: INTRODUCTION_PATH,
      title: "Introduction",
      id: "guidebook-prev-home",
    };
    if (page === "chapter01") {
      renderGuidebookChapterPage(main, loadGuidebookChapter01(), {
        previous: previousHome,
        next: {
          href: CHAPTER_02_HASH,
          title: CHAPTER_02_TITLE,
          id: "guidebook-next-chapter-2",
        },
      });
    } else if (page === "chapter02") {
      renderGuidebookChapterPage(main, loadGuidebookChapter02(), {
        previous: {
          href: CHAPTER_01_HASH,
          title: CHAPTER_01_TITLE,
          id: "guidebook-prev-chapter-1",
        },
        next: {
          href: CHAPTER_03_HASH,
          title: CHAPTER_03_TITLE,
          id: "guidebook-next-chapter-3",
        },
      });
    } else if (page === "chapter03") {
      renderGuidebookChapterPage(main, loadGuidebookChapter03(), {
        previous: {
          href: CHAPTER_02_HASH,
          title: CHAPTER_02_TITLE,
          id: "guidebook-prev-chapter-2",
        },
        next: {
          href: CHAPTER_04_HASH,
          title: CHAPTER_04_TITLE,
          id: "guidebook-next-chapter-4",
        },
      });
    } else if (page === "chapter04") {
      renderGuidebookChapterPage(main, loadGuidebookChapter04(), {
        previous: {
          href: CHAPTER_03_HASH,
          title: CHAPTER_03_TITLE,
          id: "guidebook-prev-chapter-3",
        },
        next: isGuidebookChapter05Ready()
          ? {
            href: CHAPTER_05_HASH,
            title: CHAPTER_05_TITLE,
            id: "guidebook-next-chapter-5",
          }
          : undefined,
      });
    } else if (page === "chapter05" && isGuidebookChapter05Ready()) {
      renderGuidebookChapterPage(main, loadGuidebookChapter05(), {
        previous: {
          href: CHAPTER_04_HASH,
          title: CHAPTER_04_TITLE,
          id: "guidebook-prev-chapter-4",
        },
        next: {
          href: CHAPTER_06_HASH,
          title: CHAPTER_06_TITLE,
          id: "guidebook-next-chapter-6",
        },
      });
    } else if (page === "chapter06") {
      renderGuidebookChapterPage(main, loadGuidebookChapter06(), {
        previous: {
          href: CHAPTER_05_HASH,
          title: CHAPTER_05_TITLE,
          id: "guidebook-prev-chapter-5",
        },
        next: {
          href: CHAPTER_07_HASH,
          title: CHAPTER_07_TITLE,
          id: "guidebook-next-chapter-7",
        },
      });
    } else if (page === "chapter07") {
      renderGuidebookChapterPage(main, loadGuidebookChapter07(), {
        previous: {
          href: CHAPTER_06_HASH,
          title: CHAPTER_06_TITLE,
          id: "guidebook-prev-chapter-6",
        },
        next: {
          href: CHAPTER_08_HASH,
          title: CHAPTER_08_TITLE,
          id: "guidebook-next-chapter-8",
        },
      });
    } else if (page === "chapter08") {
      renderGuidebookChapterPage(main, loadGuidebookChapter08(), {
        previous: {
          href: CHAPTER_07_HASH,
          title: CHAPTER_07_TITLE,
          id: "guidebook-prev-chapter-7",
        },
        next: {
          href: CHAPTER_09_HASH,
          title: CHAPTER_09_TITLE,
          id: "guidebook-next-chapter-9",
        },
      });
    } else if (page === "chapter09") {
      renderGuidebookChapterPage(main, loadGuidebookChapter09(), {
        previous: {
          href: CHAPTER_08_HASH,
          title: CHAPTER_08_TITLE,
          id: "guidebook-prev-chapter-8",
        },
        next: {
          href: CHAPTER_10_HASH,
          title: CHAPTER_10_TITLE,
          id: "guidebook-next-chapter-10",
        },
      });
    } else if (page === "chapter10") {
      renderGuidebookChapterPage(main, loadGuidebookChapter10(), {
        previous: {
          href: CHAPTER_09_HASH,
          title: CHAPTER_09_TITLE,
          id: "guidebook-prev-chapter-9",
        },
        next: {
          href: CHAPTER_11_HASH,
          title: CHAPTER_11_TITLE,
          id: "guidebook-next-chapter-11",
        },
      });
    } else if (page === "chapter11") {
      renderGuidebookChapterPage(main, loadGuidebookChapter11(), {
        previous: {
          href: CHAPTER_10_HASH,
          title: CHAPTER_10_TITLE,
          id: "guidebook-prev-chapter-10",
        },
        next: {
          href: CHAPTER_12_HASH,
          title: CHAPTER_12_TITLE,
          id: "guidebook-next-chapter-12",
        },
      });
    } else if (page === "chapter12") {
      renderGuidebookChapterPage(main, loadGuidebookChapter12(), {
        previous: {
          href: CHAPTER_11_HASH,
          title: CHAPTER_11_TITLE,
          id: "guidebook-prev-chapter-11",
        },
        next: {
          href: CHAPTER_13_HASH,
          title: CHAPTER_13_TITLE,
          id: "guidebook-next-chapter-13",
        },
      });
    } else if (page === "chapter13") {
      renderGuidebookChapterPage(main, loadGuidebookChapter13(), {
        previous: {
          href: CHAPTER_12_HASH,
          title: CHAPTER_12_TITLE,
          id: "guidebook-prev-chapter-12",
        },
        next: {
          href: CHAPTER_14_HASH,
          title: CHAPTER_14_TITLE,
          id: "guidebook-next-chapter-14",
        },
      });
    } else if (page === "chapter14") {
      renderGuidebookChapterPage(main, loadGuidebookChapter14(), {
        previous: {
          href: CHAPTER_13_HASH,
          title: CHAPTER_13_TITLE,
          id: "guidebook-prev-chapter-13",
        },
        next: {
          href: CHAPTER_15_HASH,
          title: CHAPTER_15_TITLE,
          id: "guidebook-next-chapter-15",
        },
      });
    } else if (page === "chapter15") {
      renderGuidebookChapterPage(main, loadGuidebookChapter15(), {
        previous: {
          href: CHAPTER_14_HASH,
          title: CHAPTER_14_TITLE,
          id: "guidebook-prev-chapter-14",
        },
        next: {
          href: CHAPTER_16_HASH,
          title: CHAPTER_16_TITLE,
          id: "guidebook-next-chapter-16",
        },
      });
    } else if (page === "chapter16") {
      renderGuidebookChapterPage(main, loadGuidebookChapter16(), {
        previous: {
          href: CHAPTER_15_HASH,
          title: CHAPTER_15_TITLE,
          id: "guidebook-prev-chapter-15",
        },
        next: {
          href: CHAPTER_17_HASH,
          title: CHAPTER_17_TITLE,
          id: "guidebook-next-chapter-17",
        },
      });
    } else if (page === "chapter17") {
      renderGuidebookChapterPage(main, loadGuidebookChapter17(), {
        previous: {
          href: CHAPTER_16_HASH,
          title: CHAPTER_16_TITLE,
          id: "guidebook-prev-chapter-16",
        },
        next: {
          href: CHAPTER_18_HASH,
          title: CHAPTER_18_TITLE,
          id: "guidebook-next-chapter-18",
        },
      });
    } else if (page === "chapter18") {
      renderGuidebookChapterPage(main, loadGuidebookChapter18(), {
        previous: {
          href: CHAPTER_17_HASH,
          title: CHAPTER_17_TITLE,
          id: "guidebook-prev-chapter-17",
        },
        next: {
          href: CHAPTER_19_HASH,
          title: CHAPTER_19_TITLE,
          id: "guidebook-next-chapter-19",
        },
      });
    } else if (page === "chapter19") {
      renderGuidebookChapterPage(main, loadGuidebookChapter19(), {
        previous: {
          href: CHAPTER_18_HASH,
          title: CHAPTER_18_TITLE,
          id: "guidebook-prev-chapter-18",
        },
        next: {
          href: CHAPTER_20_HASH,
          title: CHAPTER_20_TITLE,
          id: "guidebook-next-chapter-20",
        },
      });
    } else if (page === "chapter20") {
      renderGuidebookChapterPage(main, loadGuidebookChapter20(), {
        previous: {
          href: CHAPTER_19_HASH,
          title: CHAPTER_19_TITLE,
          id: "guidebook-prev-chapter-19",
        },
        next: {
          href: CHAPTER_21_HASH,
          title: CHAPTER_21_TITLE,
          id: "guidebook-next-chapter-21",
        },
      });
    } else if (page === "chapter21") {
      renderGuidebookChapterPage(main, loadGuidebookChapter21(), {
        previous: {
          href: CHAPTER_20_HASH,
          title: CHAPTER_20_TITLE,
          id: "guidebook-prev-chapter-20",
        },
        next: {
          href: CHAPTER_22_HASH,
          title: CHAPTER_22_TITLE,
          id: "guidebook-next-chapter-22",
        },
      });
    } else if (page === "chapter22") {
      renderGuidebookChapterPage(main, loadGuidebookChapter22(), {
        previous: {
          href: CHAPTER_21_HASH,
          title: CHAPTER_21_TITLE,
          id: "guidebook-prev-chapter-21",
        },
      });
    } else if (page === "landing") {
      renderGuidebookLanding(main);
    } else {
      renderGuidebookHome(main);
    }
    bindGuidebookReveals(main);
    finalizeGuidebookPage(root);
    trackPublicGuidebookPageView();
    if (fragment) {
      scrollGuidebookSection(root, fragment);
    } else if (pageChanged) {
      resetGuidebookWindowScroll();
      const ua = navigator.userAgent ?? "";
      if (typeof requestAnimationFrame === "function" && ua.length > 0 && !ua.includes("jsdom")) {
        requestAnimationFrame(() => resetGuidebookWindowScroll());
      }
    }
    return;
  }

  const route = parseRoute(window.location.hash.split("?")[0]);
  applyCaptureRouteTheme(route);

  if (route.name !== "capture") {
    abandonLiveMicrophone();
  }
  if (route.name !== "astronomy") {
    stopAstronomyClock();
  }

  stopScrollPresence();
  stopGuidebookMotion();
  const { main } = renderChrome(root, route);

  try {
    if (route.name === "capture" && !(await personalToolsUnlocked())) {
      main.append(
        signedOutPersonalToolsGate({
          title: "Dream Journal",
          lede: "Sign in with Google to record dreams and keep them on this device, with optional backup.",
          onSignedIn: () => {
            void renderApp(root);
          },
        }),
      );
    } else if (route.name === "capture" && route.variant === "night") await renderNightCapturePage(main, route);
    else if (route.name === "capture") await renderCapture(main, route);
    else if (route.name === "account") await renderAccountPage(main);
    else if (route.name === "astronomy") renderAstronomyPage(main);
    else if (route.name === "entry") await renderEntry(main, route.id);
    else if (route.name === "journal") await renderJournal(main);
    else if (route.name === "day") await renderDayPage(main, route.day);
    else if (route.name === "today") await renderTodayPage(main);
    else if (route.name === "days") await renderDaysPage(main);
    else if (route.name === "week") await renderWeekPage(main, route.week);
    else if (route.name === "phase") await renderPhasePage(main, route.phaseId);
    else if (route.name === "data") await renderData(main);
    else if (route.name === "method") await renderMethodPage(main);
    else if (route.name === "about") await renderAboutPage(main);
    else if (route.name === "unknown") {
      main.append(
        el("section", { class: "editorial-page" }, [
          el("h2", { class: "display-title" }, ["Not found"]),
          statusBox("error", "Unknown route", "Return home or open Today from the guide links."),
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
      `${message} Text you typed on this screen is still in the form until you leave. Try again, or use another browser that allows on-device storage.`,
    ),
  ]);
  return wrap;
}

async function renderCapture(main: HTMLElement, route: Extract<AppRoute, { name: "capture" }>): Promise<void> {
  const capability = initRecorderFlags();
  capture.type = route.presetType ?? "dream";

  const heading = el("h2", { class: "display-title" }, ["Record a Dream"]);
  const lede = el("p", { class: "lede" }, [
    "Add a text note, record audio, or both. Dreams stay on this device unless you export or enable Google Drive backup. The microphone is requested only when you tap Record.",
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
      capture.type = capture.type ?? "dream";
      if (!capture.note.trim() && !capture.recording) {
        capture.saveError = "Add a short note or a recording before saving to the Journal.";
        syncCaptureChrome();
        return;
      }
      saveBtn.disabled = true;
      syncCaptureChrome("Saving to Journal…");
      const practice = await loadCapturePracticeContext();
      const savedId = await commitCaptureToJournal(practice);
      saveBtn.disabled = false;
      if (!savedId) syncCaptureChrome();
    })();
  });

  form.append(
    types,
    el("label", { for: noteId }, ["Text note (optional if you record)"]),
    note,
    el("p", { id: "note-hint", class: "hint" }, ["Notes stay on this device unless you export or back up to Google Drive."]),
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
  capability: ReturnType<typeof initRecorderFlags>,
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
        "The microphone is on. Stop to review your recording, then save it to your Dream Journal or discard it. Leaving this page turns the microphone off.",
      ),
    );
  }
  if (pending) {
    host.append(
      statusBox(
        "info",
        pending,
        inReview || capture.recording
          ? "Nothing is in the Journal until you tap Save to Journal and the save finishes."
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
          ? `Recordings stay on this device. Save to Journal adds them to your Journal list for replay and export.`
          : "This browser did not report a usable recording format. Text notes still save to the Journal when you tap Save.",
      ]),
    );
  }
}

async function renderJournal(main: HTMLElement): Promise<void> {
  if (!(await personalToolsUnlocked())) {
    main.append(
      signedOutPersonalToolsGate({
        title: "Dream Journal",
        lede: "Sign in with Google to save dreams on this device, replay recordings, and optionally back up to your Google account.",
        onSignedIn: () => {
          void renderApp(document.getElementById("app")!);
        },
      }),
    );
    return;
  }
  const entries = await localStore.listEntries();
  const list = el("div", { class: "stack" });
  if (entries.length === 0) list.append(emptyJournal());
  else entries.forEach((entry) => list.append(entryCard(entry)));
  main.append(
    el("section", { class: "journal-surface" }, [
      el("p", { class: "eyebrow" }, ["Dream Journal"]),
      el("h2", { class: "display-title" }, ["Dream Journal"]),
      el("p", { class: "lede" }, [
        "Dreams you saved — newest first. Replay recordings, edit notes, or delete entries on this device.",
      ]),
      entries.length
        ? statusBox(
            "info",
            "Your dreams on this device",
            `${entries.length} ${entries.length === 1 ? "entry is" : "entries are"} available here, including anything saved before you signed in.`,
          )
        : el("span"),
      el("p", { class: "actions" }, [
        el("a", { href: "#/capture/dream", class: "button primary", id: "journal-new-dream" }, ["New Dream Entry"]),
        el("a", { href: "#/capture/dream", class: "button", id: "journal-record-dream" }, ["Record a Dream"]),
      ]),
      list,
    ]),
  );
}

async function renderEntry(main: HTMLElement, id: string): Promise<void> {
  if (!(await personalToolsUnlocked())) {
    main.append(
      signedOutPersonalToolsGate({
        title: "Dream Journal",
        lede: "Sign in with Google to open dream entries on this device.",
        onSignedIn: () => {
          void renderApp(document.getElementById("app")!);
        },
      }),
    );
    return;
  }
  const savedFlag = sessionStorage.getItem("pex-just-saved") === id;
  if (savedFlag) sessionStorage.removeItem("pex-just-saved");
  const found = await localStore.getEntry(id);
  if (!found) {
    main.append(el("h2", {}, ["Entry"]), statusBox("error", "Not found", "That entry is not in local storage on this device."));
    return;
  }
  const { entry, media } = found;
  const heading = el("h2", { class: "display-title" }, ["Dream entry"]);
  const meta = el("p", { class: "meta" }, [
    `${ENTRY_TYPE_LABEL[entry.type]} · `,
    el("time", { datetime: new Date(entry.createdAt).toISOString() }, [formatWhen(entry.createdAt)]),
    text(" · "),
    el("span", { class: "sync-state-label" }, [syncStateLabel(entry.syncState)]),
  ]);
  const note = el("textarea", { id: "entry-note", rows: "6" });
  note.value = entry.note;
  const saveNote = el("button", { type: "button" }, ["Save note"]);
  const noteStatus = el("div");
  saveNote.addEventListener("click", () => {
    void (async () => {
      try {
        await localStore.updateNote(entry.id, note.value);
        noteStatus.replaceChildren(statusBox("ok", "Saved", "The note update was saved on this device."));
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
    el("p", { class: "eyebrow" }, ["Dream Journal"]),
    heading,
    savedFlag
      ? statusBox(
          "ok",
          "Saved to Journal",
          "Saved on this device. Replay the recording below or open your Dream Journal. Google backup is separate if you connected Drive.",
        )
      : el("span"),
    meta,
    el("label", { for: "entry-note" }, ["Text note"]),
    note,
    saveNote,
    noteStatus,
    mediaBlock,
    deleteHost,
    el("p", {}, [el("a", { href: "#/journal" }, ["Back to Dream Journal"])]),
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
  });

  const schema = await localStore.getSchemaInfo();

  main.append(
    el("section", { class: "stack editorial-page" }, [
      el("p", { class: "eyebrow" }, ["Local storage"]),
      el("h2", { class: "display-title" }, ["Data on this device"]),
      el("p", { class: "lede" }, [
        "Journal text, recordings, and day progress stay in this browser on this device unless you export or use Google backup. Clearing browser data can remove them. Export downloads a ZIP you can keep.",
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

