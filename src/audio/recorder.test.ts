import { beforeEach, describe, expect, it, vi } from "vitest";
import { AudioCapture, inspectRecorderCapability, RECORDING_CANDIDATES } from "./recorder.ts";
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
  }
  start(): void {
    this.state = "recording";
  }
  stop(): void {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob([new Uint8Array([1, 2])], { type: this.mimeType }) });
    this.onstop?.();
  }
  static isTypeSupported(type: string): boolean {
    return type.startsWith("audio/webm");
  }
}

function fakeStream(): MediaStream {
  const track = {
    stop: vi.fn(),
    addEventListener: vi.fn(),
  };
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
    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(fakeStream()),
      },
    });
  });

  it("requests the microphone only when start() runs", async () => {
    const getUserMedia = navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>;
    expect(getUserMedia).not.toHaveBeenCalled();
    const capture = new AudioCapture(inspectRecorderCapability());
    await capture.start();
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    const result = await capture.stop();
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it("times out a hung getUserMedia without retrying", async () => {
    vi.useFakeTimers();
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockReturnValueOnce(new Promise(() => undefined));
    const capture = new AudioCapture(inspectRecorderCapability());
    const start = capture.start();
    const assertion = expect(start).rejects.toMatchObject({ code: "recorder-failed" });
    await vi.advanceTimersByTimeAsync(12000);
    await assertion;
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
});
