import { AppError } from "../domain/types.ts";

export const RECORDING_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
] as const;

export const GET_USER_MEDIA_TIMEOUT_MS = 12_000;

export type RecorderCapability = {
  mediaDevices: boolean;
  getUserMedia: boolean;
  mediaRecorder: boolean;
  selectedMimeType: string | null;
  supportedCandidates: string[];
};

export function inspectRecorderCapability(
  rec: typeof MediaRecorder | undefined = typeof MediaRecorder === "undefined" ? undefined : MediaRecorder,
  nav: Pick<Navigator, "mediaDevices"> | undefined = typeof navigator === "undefined" ? undefined : navigator,
): RecorderCapability {
  const mediaDevices = Boolean(nav?.mediaDevices);
  const getUserMedia = typeof nav?.mediaDevices?.getUserMedia === "function";
  const isTypeSupported =
    rec && typeof rec.isTypeSupported === "function" ? rec.isTypeSupported.bind(rec) : null;
  const mediaRecorder = typeof rec === "function" || Boolean(isTypeSupported);
  const supportedCandidates: string[] = [];
  let selectedMimeType: string | null = null;
  if (isTypeSupported) {
    for (const candidate of RECORDING_CANDIDATES) {
      if (isTypeSupported(candidate)) {
        supportedCandidates.push(candidate);
        if (!selectedMimeType) selectedMimeType = candidate;
      }
    }
  }
  return { mediaDevices, getUserMedia, mediaRecorder, selectedMimeType, supportedCandidates };
}

export function assertCanRecord(capability = inspectRecorderCapability()): void {
  if (!capability.mediaRecorder || !capability.getUserMedia) {
    throw new AppError(
      "recorder-unsupported",
      "This browser cannot record audio here. You can still save a text note.",
    );
  }
  if (!capability.selectedMimeType && capability.mediaRecorder) {
    throw new AppError(
      "mime-unsupported",
      "No supported recording format was found. You can still save a text note.",
    );
  }
}

export type RecordingResult = {
  blob: Blob;
  mimeType: string;
  interrupted: boolean;
};

export function stopAllTracks(stream: MediaStream | null | undefined): void {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    try {
      track.stop();
    } catch {
      // already ended
    }
  }
}

export class AudioCapture {
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private interrupted = false;
  private stopPromise: Promise<RecordingResult> | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private abandoned = false;
  private pendingMedia: Promise<MediaStream> | null = null;

  constructor(private readonly capability = inspectRecorderCapability()) {}

  isLive(): boolean {
    if (this.recorder && this.recorder.state !== "inactive") return true;
    if (this.pendingMedia) return true;
    if (!this.stream) return false;
    return this.stream.getTracks().some((track) => track.readyState !== "ended");
  }

  async start(): Promise<void> {
    this.release();
    this.abandoned = false;
    this.chunks = [];
    this.interrupted = false;
    assertCanRecord(this.capability);

    const mediaRequest = navigator.mediaDevices.getUserMedia({ audio: true });
    this.pendingMedia = mediaRequest;
    const discardIfNotKept = (stream: MediaStream) => {
      if (this.stream !== stream) stopAllTracks(stream);
    };

    let stream: MediaStream;
    try {
      stream = await new Promise<MediaStream>((resolve, reject) => {
        this.timeoutId = setTimeout(() => {
          this.timeoutId = null;
          reject(
            new AppError(
              "recorder-failed",
              "The microphone did not become available. No permission loop was started. Text capture still works.",
            ),
          );
        }, GET_USER_MEDIA_TIMEOUT_MS);
        mediaRequest.then(
          (value) => {
            this.clearTimeoutId();
            resolve(value);
          },
          (error: unknown) => {
            this.clearTimeoutId();
            reject(error);
          },
        );
      });
    } catch (error) {
      this.clearTimeoutId();
      this.pendingMedia = null;
      void mediaRequest.then(discardIfNotKept, () => undefined);
      if (this.abandoned) {
        throw new AppError("recorder-failed", "Recording was cancelled. The microphone is off.");
      }
      if (error instanceof AppError) throw error;
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        throw new AppError(
          "permission-denied",
          "Microphone access was not granted. Text capture still works. This app will not ask again until you tap Record.",
        );
      }
      if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        throw new AppError("recorder-failed", "No microphone was found. Text capture still works.");
      }
      throw new AppError("recorder-failed", "The microphone could not be opened. Text capture still works.");
    }

    this.pendingMedia = null;
    if (this.abandoned) {
      stopAllTracks(stream);
      throw new AppError("recorder-failed", "Recording was cancelled. The microphone is off.");
    }

    this.stream = stream;
    const mimeType = this.capability.selectedMimeType ?? "";
    try {
      this.recorder = mimeType ? new MediaRecorder(this.stream, { mimeType }) : new MediaRecorder(this.stream);
    } catch {
      this.release();
      throw new AppError("mime-unsupported", "Recording could not start with an available format. Text capture still works.");
    }

    const recorder = this.recorder;
    this.stopPromise = new Promise((resolve, reject) => {
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.chunks.push(event.data);
      };
      recorder.onerror = () => {
        this.interrupted = true;
        stopAllTracks(this.stream);
        this.stream = null;
        this.recorder = null;
        this.stopPromise = null;
        reject(new AppError("recorder-failed", "Recording failed. The microphone is off. Nothing was saved automatically."));
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || "application/octet-stream";
        const blob = new Blob(this.chunks, { type });
        stopAllTracks(this.stream);
        this.stream = null;
        resolve({ blob, mimeType: type, interrupted: this.interrupted });
      };
    });
    void this.stopPromise.catch(() => undefined);

    for (const track of this.stream.getTracks()) {
      track.addEventListener("ended", () => {
        this.interrupted = true;
        if (this.recorder && this.recorder.state !== "inactive") {
          try {
            this.recorder.stop();
          } catch {
            this.release();
          }
        } else {
          this.release();
        }
      });
    }

    try {
      recorder.start(250);
    } catch {
      this.release();
      throw new AppError("recorder-failed", "Recording could not start. The microphone is off.");
    }
  }

  async stop(): Promise<RecordingResult> {
    if (!this.recorder || !this.stopPromise) {
      this.release();
      throw new AppError("recorder-failed", "There is no active recording to stop.");
    }
    if (this.recorder.state !== "inactive") {
      try {
        this.recorder.stop();
      } catch {
        this.release();
        throw new AppError("recorder-failed", "Recording could not be stopped cleanly. The microphone is off.");
      }
    }
    try {
      const result = await this.stopPromise;
      this.recorder = null;
      this.stopPromise = null;
      stopAllTracks(this.stream);
      this.stream = null;
      if (result.interrupted && result.blob.size === 0) {
        throw new AppError("recording-interrupted", "Recording was interrupted before any audio was captured. The microphone is off.");
      }
      return result;
    } catch (error) {
      this.release();
      throw error;
    }
  }

  release(): void {
    this.abandoned = true;
    this.clearTimeoutId();
    const pending = this.pendingMedia;
    this.pendingMedia = null;
    if (pending) {
      void pending.then((stream) => {
        if (this.stream !== stream) stopAllTracks(stream);
      }, () => undefined);
    }
    const recorder = this.recorder;
    this.recorder = null;
    this.stopPromise = null;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        // already stopping
      }
    }
    stopAllTracks(this.stream);
    this.stream = null;
  }

  private clearTimeoutId(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
