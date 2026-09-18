import { AppError } from "../domain/types.ts";

export const RECORDING_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
] as const;

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

function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout: () => Error): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(onTimeout()), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export class AudioCapture {
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private interrupted = false;
  private stopPromise: Promise<RecordingResult> | null = null;

  constructor(private readonly capability = inspectRecorderCapability()) {}

  async start(): Promise<void> {
    assertCanRecord(this.capability);
    this.chunks = [];
    this.interrupted = false;
    try {
      this.stream = await withTimeout(
        navigator.mediaDevices.getUserMedia({ audio: true }),
        12000,
        () =>
          new AppError(
            "recorder-failed",
            "The microphone did not become available. No permission loop was started. Text capture still works.",
          ),
      );
    } catch (error) {
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

    const mimeType = this.capability.selectedMimeType ?? "";
    try {
      this.recorder = mimeType ? new MediaRecorder(this.stream, { mimeType }) : new MediaRecorder(this.stream);
    } catch {
      this.cleanupStream();
      throw new AppError("mime-unsupported", "Recording could not start with an available format. Text capture still works.");
    }

    const recorder = this.recorder;
    this.stopPromise = new Promise((resolve, reject) => {
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.chunks.push(event.data);
      };
      recorder.onerror = () => {
        this.interrupted = true;
        reject(new AppError("recorder-failed", "Recording failed. Nothing was saved automatically."));
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || "application/octet-stream";
        const blob = new Blob(this.chunks, { type });
        this.cleanupStream();
        resolve({ blob, mimeType: type, interrupted: this.interrupted });
      };
    });

    for (const track of this.stream.getTracks()) {
      track.addEventListener("ended", () => {
        this.interrupted = true;
        if (this.recorder && this.recorder.state !== "inactive") {
          this.recorder.stop();
        }
      });
    }

    try {
      recorder.start(250);
    } catch {
      this.cleanupStream();
      throw new AppError("recorder-failed", "Recording could not start.");
    }
  }

  async stop(): Promise<RecordingResult> {
    if (!this.recorder || !this.stopPromise) {
      throw new AppError("recorder-failed", "There is no active recording to stop.");
    }
    if (this.recorder.state !== "inactive") {
      this.recorder.stop();
    }
    const result = await this.stopPromise;
    this.recorder = null;
    this.stopPromise = null;
    if (result.interrupted && result.blob.size === 0) {
      throw new AppError("recording-interrupted", "Recording was interrupted before any audio was captured.");
    }
    return result;
  }

  interruptFromOutside(): void {
    this.interrupted = true;
    if (this.recorder && this.recorder.state !== "inactive") {
      this.recorder.stop();
    }
  }

  private cleanupStream(): void {
    if (this.stream) {
      for (const track of this.stream.getTracks()) track.stop();
    }
    this.stream = null;
  }
}
