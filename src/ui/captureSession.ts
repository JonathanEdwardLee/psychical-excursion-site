import { AudioCapture, inspectRecorderCapability } from "../audio/recorder.ts";
import { localStore } from "../db/store.ts";
import { AppError, createId, type EntryType } from "../domain/types.ts";
import { afterLocalSave } from "../sync/syncEngine.ts";
import { loadCapturePracticeContext, type CapturePracticeContext } from "./captureContext.ts";
import { announce, go } from "./dom.ts";

export type CaptureState = {
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
  locallySafeEntryId: string | null;
  recordingStartedAt: number | null;
};

export const capture: CaptureState = {
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
  locallySafeEntryId: null,
  recordingStartedAt: null,
};

export function isCaptureMicrophoneHeld(): boolean {
  return capture.starting || capture.recordingActive || Boolean(capture.recorder?.isLive());
}

export function abandonLiveMicrophone(): void {
  capture.recorder?.release();
  capture.recorder = null;
  capture.recordingActive = false;
  capture.starting = false;
  capture.recordingStartedAt = null;
}

export function resetCaptureMedia(): void {
  abandonLiveMicrophone();
  capture.recording = null;
  capture.interrupted = false;
}

export function microphoneBusy(): boolean {
  return capture.starting || capture.recordingActive;
}

export async function commitCaptureToJournal(
  practice: CapturePracticeContext,
  options: { navigate?: boolean } = { navigate: true },
): Promise<string | null> {
  if (!capture.type) {
    capture.saveError = "Choose Dream, Experience, or Sensation before saving to the Journal.";
    return null;
  }
  if (!capture.note.trim() && !capture.recording) {
    capture.saveError = "Add a short note or a recording before saving to the Journal.";
    return null;
  }
  capture.saving = true;
  try {
    const saved = await localStore.saveCapture({
      id: createId("entry"),
      type: capture.type,
      note: capture.note,
      createdAt: Date.now(),
      pexDay: practice.day,
      phaseId: practice.phaseId,
      audio: capture.recording
        ? { id: createId("audio"), blob: capture.recording.blob, mimeType: capture.recording.mimeType }
        : null,
    });
    await afterLocalSave(saved.id);
    capture.saving = false;
    capture.note = "";
    capture.locallySafeEntryId = saved.id;
    resetCaptureMedia();
    announce("Saved locally");
    if (options.navigate) {
      sessionStorage.setItem("pex-just-saved", saved.id);
      go(`/journal/${saved.id}`);
    }
    return saved.id;
  } catch (error) {
    capture.saving = false;
    capture.saveError = error instanceof AppError ? error.message : "Save failed. The entry was not marked saved.";
    return null;
  }
}

export async function persistNightStopToJournal(): Promise<string | null> {
  const practice = await loadCapturePracticeContext();
  if (!capture.type) capture.type = "dream";
  return commitCaptureToJournal(practice, { navigate: false });
}

export function initRecorderFlags(): ReturnType<typeof inspectRecorderCapability> {
  const capability = inspectRecorderCapability();
  if (!capability.mediaRecorder || !capability.getUserMedia) capture.recorderUnavailable = true;
  if (capability.mediaRecorder && !capability.selectedMimeType) capture.mimeUnsupported = true;
  return capability;
}
