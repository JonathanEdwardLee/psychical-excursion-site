import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { abandonLiveMicrophone, isCaptureMicrophoneHeld, renderApp } from "./app.ts";
import { localStore } from "../db/store.ts";
import { DB_NAME } from "../domain/types.ts";

async function resetLocalDatabase(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("could not reset indexeddb"));
    request.onblocked = () => resolve();
  });
}

async function mount(hash: string): Promise<HTMLElement> {
  window.location.hash = hash;
  document.body.innerHTML = '<div id="app"></div>';
  const root = document.getElementById("app")!;
  await renderApp(root);
  return root;
}

describe("core UI flows", () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    await resetLocalDatabase();
  });

  it("reaches Capture in one intentional action from Home", async () => {
    const root = await mount("#/");
    const cta = root.querySelector("#home-capture") as HTMLAnchorElement;
    expect(cta).toBeTruthy();
    expect(cta.getAttribute("href")).toBe("#/capture");
    expect(root.querySelector('.nav-primary a[href="#/capture"]')).toBeTruthy();
    window.location.hash = "#/capture";
    await renderApp(root);
    expect(root.querySelector("h2")?.textContent).toBe("Capture");
    expect(root.querySelectorAll('input[name="capture-type"]')).toHaveLength(3);
  });

  it("does not call getUserMedia until Record is used", async () => {
    const getUserMedia = vi.fn();
    vi.stubGlobal("navigator", {
      ...navigator,
      mediaDevices: { getUserMedia },
    });
    const root = await mount("#/capture");
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(root.querySelector("#record-btn")?.textContent).toBe("Record");
  });

  it("saves a text-only entry only after IndexedDB confirmation and lists it", async () => {
    const root = await mount("#/capture");
    const dream = root.querySelector("#type-dream") as HTMLInputElement;
    dream.checked = true;
    dream.dispatchEvent(new Event("change", { bubbles: true }));
    const note = root.querySelector("#capture-note") as HTMLTextAreaElement;
    note.value = "fixture-ui-note";
    note.dispatchEvent(new Event("input"));
    (root.querySelector("#save-btn") as HTMLButtonElement).click();
    await vi.waitFor(async () => {
      expect(window.location.hash).toMatch(/#\/journal\/entry-/);
    });
    const detail = await mount(window.location.hash);
    expect(detail.textContent).toMatch(/Saved locally/);
    const journal = await mount("#/journal");
    expect(journal.textContent).toMatch(/fixture-ui-note/);
  });

  it("shows an empty journal state", async () => {
    const existing = await localStore.listEntries();
    for (const entry of existing) await localStore.deleteEntry(entry.id);
    const root = await mount("#/journal");
    expect(root.textContent).toMatch(/No entries yet/);
  });

  it("persists bedtime mode locally", async () => {
    const root = await mount("#/data");
    (root.querySelector("#theme-toggle") as HTMLButtonElement).click();
    expect(document.documentElement.dataset.theme).toBe("bedtime");
    expect(localStorage.getItem("pex-theme")).toBe("bedtime");
  });

  it("labels capture controls for assistive tech", async () => {
    const root = await mount("#/capture");
    expect(root.querySelector("legend")?.textContent).toBe("Capture type");
    expect(root.querySelector('label[for="capture-note"]')).toBeTruthy();
    expect(root.querySelector("h2")).toBeTruthy();
  });

  it("uses the founder primary mark in the header without a hero lockup", async () => {
    const root = await mount("#/");
    const light = root.querySelector(".brand-logo-light") as HTMLImageElement;
    const reverse = root.querySelector(".brand-logo-reverse") as HTMLImageElement;
    expect(light.getAttribute("src")).toBe("/brand/pex-logo-primary.svg");
    expect(reverse.getAttribute("src")).toBe("/brand/pex-logo-primary-reverse.svg");
    expect(root.querySelector("h1")?.textContent).toBe("Psychical Excursion");
    expect(root.querySelector("h1")?.classList.contains("visually-hidden")).toBe(true);
    expect(root.textContent).not.toMatch(/DEVELOPMENT FIXTURE/);
  });

  it("renders all 60 canonical days without fixture copy", async () => {
    const { loadCurriculumPacket } = await import("../content/load.ts");
    const packet = loadCurriculumPacket();
    expect(packet.source).toBe("canonical-packet");
    expect(packet.days).toHaveLength(60);
    for (const document of packet.days) {
      const root = await mount(`#/day/${document.day}`);
      expect(root.querySelector("h2")?.textContent).toBe(document.title);
      expect(root.textContent).not.toMatch(/DEVELOPMENT FIXTURE/);
      expect(root.textContent).not.toMatch(/placeholder day/i);
    }
  });

  it("renders required local product surfaces", async () => {
    const today = await mount("#/today");
    expect(today.textContent).toMatch(/Today/);
    expect(today.textContent).toMatch(/CATCH THE DREAM/);
    expect(today.textContent).not.toMatch(/DEVELOPMENT FIXTURE/);
    const day1 = await mount("#/day/1");
    expect(day1.querySelector("h2")?.textContent).toBe("CATCH THE DREAM");
    expect(day1.textContent).toMatch(/Start with recall/);
    expect(day1.querySelector("#complete-day")).toBeTruthy();
    const day60 = await mount("#/day/60");
    expect(day60.querySelector("h2")?.textContent).toBe("INDEPENDENT ATTEMPT");
    const days = await mount("#/days");
    expect(days.textContent).toMatch(/REMEMBER/);
    expect(days.textContent).toMatch(/LEARN YOUR DOOR/);
    expect(days.querySelectorAll(".day-row")).toHaveLength(60);
    expect(days.querySelectorAll(".phase-chapter")).toHaveLength(8);
    expect(days.querySelector(".day-row-link")?.querySelector(".day-title")?.textContent).toBe("CATCH THE DREAM");
    const phase = await mount("#/phase/feel");
    expect(phase.querySelector("h2")?.textContent).toBe("FEEL");
    const method = await mount("#/method");
    expect(method.querySelector("h2")?.textContent).toBe("Method");
    const about = await mount("#/about");
    expect(about.textContent).toMatch(/Evidence, safety, source/);
    expect(about.textContent).toMatch(/Hoopsnake Designs/);
    const fiftyOne = await mount("#/day/51");
    expect(fiftyOne.textContent).toMatch(/Optional/);
  });

  it("completes and undoes a day without using scroll depth", async () => {
    const root = await mount("#/day/2");
    expect(root.querySelector("#complete-day")).toBeTruthy();
    (root.querySelector("#complete-day") as HTMLButtonElement).click();
    await vi.waitFor(() => {
      expect(root.querySelector("#undo-day")).toBeTruthy();
      expect(root.querySelector(".complete-panel.is-complete")).toBeTruthy();
    });
    (root.querySelector("#undo-day") as HTMLButtonElement).click();
    await vi.waitFor(() => {
      expect(root.querySelector("#complete-day")).toBeTruthy();
    });
    const listed = await localStore.listProgress();
    expect(listed.find((row) => row.day === 2)?.completedAt).toBeNull();
  });
});

describe("privacy of local saves", () => {
  it("does not invoke fetch when saving or exporting journal data", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    await localStore.saveCapture({
      id: "privacy-entry",
      type: "experience",
      note: "fixture-privacy-note",
      createdAt: Date.now(),
      audio: {
        id: "privacy-audio",
        blob: new Blob([new Uint8Array([1])], { type: "audio/webm" }),
        mimeType: "audio/webm",
      },
    });
    await localStore.updateNote("privacy-entry", "fixture-privacy-note-2");
    await localStore.exportBundle();
    await localStore.deleteEntry("privacy-entry");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

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
    if (this.state === "inactive") return;
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob([new Uint8Array([1, 2])], { type: this.mimeType }) });
    this.onstop?.();
  }
  static isTypeSupported(type: string): boolean {
    return type.startsWith("audio/webm");
  }
}

describe("capture microphone lifecycle", () => {
  let trackStop: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    trackStop = vi.fn();
    const track = {
      readyState: "live",
      stop: trackStop.mockImplementation(() => {
        track.readyState = "ended";
      }),
      addEventListener: vi.fn(),
    };
    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
    vi.stubGlobal("navigator", {
      ...navigator,
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [track] }),
      },
    });
  });

  afterEach(() => {
    abandonLiveMicrophone();
  });

  async function startRecording(root: HTMLElement): Promise<void> {
    (root.querySelector("#record-btn") as HTMLButtonElement).click();
    await vi.waitFor(() => {
      expect(root.querySelector("#record-btn")?.textContent).toBe("Stop");
    });
  }

  it("does not complete Save while recording and does not drop the live microphone", async () => {
    const root = await mount("#/capture");
    const dream = root.querySelector("#type-dream") as HTMLInputElement;
    dream.checked = true;
    dream.dispatchEvent(new Event("change", { bubbles: true }));
    const note = root.querySelector("#capture-note") as HTMLTextAreaElement;
    note.value = "fixture-while-recording";
    note.dispatchEvent(new Event("input"));
    await startRecording(root);
    const saveBtn = root.querySelector("#save-btn") as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
    expect(isCaptureMicrophoneHeld()).toBe(true);
    expect(root.textContent).toMatch(/microphone is on/i);
    const hash = window.location.hash;
    saveBtn.disabled = false;
    saveBtn.click();
    await Promise.resolve();
    expect(window.location.hash).toBe(hash);
    expect(isCaptureMicrophoneHeld()).toBe(true);
    expect(trackStop).not.toHaveBeenCalled();
  });

  it("stops acquired tracks when navigating away from Capture", async () => {
    const root = await mount("#/capture");
    await startRecording(root);
    expect(isCaptureMicrophoneHeld()).toBe(true);
    window.location.hash = "#/journal";
    await renderApp(root);
    expect(trackStop).toHaveBeenCalled();
    expect(isCaptureMicrophoneHeld()).toBe(false);
    expect(root.querySelector("h2")?.textContent).toBe("Journal");
  });

  it("stops acquired tracks when the capture session is abandoned", async () => {
    const root = await mount("#/capture");
    await startRecording(root);
    abandonLiveMicrophone();
    expect(trackStop).toHaveBeenCalled();
    expect(isCaptureMicrophoneHeld()).toBe(false);
  });
});
