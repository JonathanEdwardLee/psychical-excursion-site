import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderApp } from "./app.ts";
import { localStore } from "../db/store.ts";

async function mount(hash: string): Promise<HTMLElement> {
  window.location.hash = hash;
  document.body.innerHTML = '<div id="app"></div>';
  const root = document.getElementById("app")!;
  await renderApp(root);
  return root;
}

describe("core UI flows", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("reaches Capture in one intentional action from Home", async () => {
    const root = await mount("#/");
    const cta = root.querySelector("#home-capture") as HTMLAnchorElement;
    expect(cta).toBeTruthy();
    expect(cta.getAttribute("href")).toBe("#/capture");
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
