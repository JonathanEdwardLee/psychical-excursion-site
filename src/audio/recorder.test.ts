import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AudioCapture,
  GET_USER_MEDIA_TIMEOUT_MS,
  inspectRecorderCapability,
  RECORDING_CANDIDATES,
  stopAllTracks,
} from "./recorder.ts";
import { AppError } from "../domain/types.ts";

class FakeMediaRecorder {
  state = "inactive";
  mimeType: string;
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(
    public stream: MediaStream,
    options?: { mimeType?: string },
  ) {
    this.mimeType = options?.mimeType ?? "audio/webm";
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- test seam for onerror
    lastRecorder = this;
  }
  start(): void {
    this.state = "recording";
  }
  stop(): void {
    if (this.state === "inactive") return;
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob([new Uint8Array([1, 2])], { type: this.mimeType }) });
    this.onstop?.();
  }
  static isTypeSupported(type: string): boolean {
    return type.startsWith("audio/webm");
  }
}

let lastRecorder: FakeMediaRecorder | null = null;

function fakeTrack(): { stop: ReturnType<typeof vi.fn>; addEventListener: ReturnType<typeof vi.fn>; readyState: string } {
  const track = {
    readyState: "live",
    stop: vi.fn(() => {
      track.readyState = "ended";
    }),
    addEventListener: vi.fn(),
  };
  return track;
}

function fakeStream(track = fakeTrack()): MediaStream {
  return { getTracks: () => [track] } as unknown as MediaStream;
}

describe("recorder capability", () => {
  it("selects the first supported candidate rather than assuming a codec", () => {
    const rec = {
      isTypeSupported: (type: string) => type === "audio/ogg",
    } as unknown as typeof MediaRecorder;
    const nav = { mediaDevices: { getUserMedia: vi.fn() } } as unknown as Navigator;
    const capability = inspectRecorderCapability(rec, nav);
    expect(capability.selectedMimeType).toBe("audio/ogg");
    expect(RECORDING_CANDIDATES).toContain("audio/webm;codecs=opus");
  });

  it("reports missing MediaRecorder", () => {
    const capability = inspectRecorderCapability(undefined, { mediaDevices: undefined } as unknown as Navigator);
    expect(capability.mediaRecorder).toBe(false);
    expect(capability.selectedMimeType).toBeNull();
  });
});

describe("AudioCapture", () => {
  beforeEach(() => {
    lastRecorder = null;
    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(fakeStream()),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("requests the microphone only when start() runs and releases tracks on stop", async () => {
    const track = fakeTrack();
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockResolvedValueOnce(fakeStream(track));
    const getUserMedia = navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>;
    expect(getUserMedia).not.toHaveBeenCalled();
    const capture = new AudioCapture(inspectRecorderCapability());
    await capture.start();
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(capture.isLive()).toBe(true);
    const result = await capture.stop();
    expect(result.blob.size).toBeGreaterThan(0);
    expect(track.stop).toHaveBeenCalled();
    expect(capture.isLive()).toBe(false);
  });

  it("times out a hung getUserMedia without retrying", async () => {
    vi.useFakeTimers();
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockReturnValueOnce(new Promise(() => undefined));
    const capture = new AudioCapture(inspectRecorderCapability());
    const start = capture.start();
    const assertion = expect(start).rejects.toMatchObject({ code: "recorder-failed" });
    await vi.advanceTimersByTimeAsync(GET_USER_MEDIA_TIMEOUT_MS);
    await assertion;
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("stops tracks on a getUserMedia result that arrives after timeout", async () => {
    vi.useFakeTimers();
    let resolveMedia: (stream: MediaStream) => void = () => undefined;
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      new Promise<MediaStream>((resolve) => {
        resolveMedia = resolve;
      }),
    );
    const capture = new AudioCapture(inspectRecorderCapability());
    const start = capture.start();
    const assertion = expect(start).rejects.toMatchObject({ code: "recorder-failed" });
    await vi.advanceTimersByTimeAsync(GET_USER_MEDIA_TIMEOUT_MS);
    await assertion;
    const track = fakeTrack();
    resolveMedia(fakeStream(track));
    await Promise.resolve();
    await Promise.resolve();
    expect(track.stop).toHaveBeenCalled();
    expect(capture.isLive()).toBe(false);
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("maps permission denial without retrying", async () => {
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new DOMException("denied", "NotAllowedError"),
    );
    const capture = new AudioCapture(inspectRecorderCapability());
    await expect(capture.start()).rejects.toMatchObject({ code: "permission-denied" });
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
  });

  it("does not assume an unsupported MIME type", async () => {
    FakeMediaRecorder.isTypeSupported = () => false;
    const capability = inspectRecorderCapability();
    expect(capability.selectedMimeType).toBeNull();
    const capture = new AudioCapture(capability);
    await expect(capture.start()).rejects.toBeInstanceOf(AppError);
    FakeMediaRecorder.isTypeSupported = (type: string) => type.startsWith("audio/webm");
  });

  it("releases tracks when MediaRecorder cannot be constructed", async () => {
    const track = fakeTrack();
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockResolvedValueOnce(fakeStream(track));
    vi.stubGlobal(
      "MediaRecorder",
      class {
        static isTypeSupported(): boolean {
          return true;
        }
        constructor() {
          throw new Error("construct-failed");
        }
      },
    );
    const capture = new AudioCapture(inspectRecorderCapability());
    await expect(capture.start()).rejects.toMatchObject({ code: "mime-unsupported" });
    expect(track.stop).toHaveBeenCalled();
    expect(capture.isLive()).toBe(false);
  });

  it("releases tracks on recorder error", async () => {
    const track = fakeTrack();
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockResolvedValueOnce(fakeStream(track));
    const capture = new AudioCapture(inspectRecorderCapability());
    await capture.start();
    lastRecorder?.onerror?.();
    await Promise.resolve();
    expect(track.stop).toHaveBeenCalled();
    expect(capture.isLive()).toBe(false);
  });

  it("releases tracks when an external track ends", async () => {
    const track = fakeTrack();
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockResolvedValueOnce(fakeStream(track));
    const capture = new AudioCapture(inspectRecorderCapability());
    await capture.start();
    const ended = track.addEventListener.mock.calls.find((call) => call[0] === "ended")?.[1] as (() => void) | undefined;
    expect(ended).toBeTypeOf("function");
    ended?.();
    expect(track.stop).toHaveBeenCalled();
  });

  it("releases a late stream after abandon during getUserMedia", async () => {
    let resolveMedia: (stream: MediaStream) => void = () => undefined;
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      new Promise<MediaStream>((resolve) => {
        resolveMedia = resolve;
      }),
    );
    const capture = new AudioCapture(inspectRecorderCapability());
    const start = capture.start();
    const assertion = expect(start).rejects.toBeInstanceOf(AppError);
    capture.release();
    capture.release();
    const track = fakeTrack();
    resolveMedia(fakeStream(track));
    await assertion;
    await Promise.resolve();
    expect(track.stop).toHaveBeenCalled();
    expect(capture.isLive()).toBe(false);
  });

  it("stopAllTracks is safe on null and already-stopped tracks", () => {
    const track = fakeTrack();
    track.stop.mockImplementationOnce(() => {
      throw new Error("already-stopped");
    });
    expect(() => stopAllTracks(undefined)).not.toThrow();
    expect(() => stopAllTracks(fakeStream(track))).not.toThrow();
  });
});
