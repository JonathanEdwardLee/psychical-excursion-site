import { describe, expect, it } from "vitest";
import { LocalStore, classifyIdbError } from "./store.ts";
import { AppError, DAY_COUNT } from "../domain/types.ts";

describe("LocalStore", () => {
  it("saves, lists, updates, and deletes an entry with audio in one transaction path", async () => {
    const store = new LocalStore();
    const blob = new Blob([new Uint8Array([9, 8, 7])], { type: "audio/webm" });
    const saved = await store.saveCapture({
      id: "entry-fixture-1",
      type: "dream",
      note: "fixture-note-alpha",
      createdAt: 1_700_000_000_000,
      audio: { id: "audio-fixture-1", blob, mimeType: "audio/webm" },
    });
    expect(saved.audioId).toBe("audio-fixture-1");
    const listed = await store.listEntries();
    expect(listed[0]?.id).toBe("entry-fixture-1");
    const loaded = await store.getEntry("entry-fixture-1");
    expect(loaded?.media?.byteLength).toBe(3);
    const updated = await store.updateNote("entry-fixture-1", "fixture-note-beta");
    expect(updated.note).toBe("fixture-note-beta");
    await store.deleteEntry("entry-fixture-1");
    expect(await store.getEntry("entry-fixture-1")).toBeNull();
    const bundle = await store.exportBundle();
    expect(bundle.media.find((item) => item.id === "audio-fixture-1")).toBeUndefined();
  });

  it("seeds sixty unlocked days", async () => {
    const store = new LocalStore();
    const rows = await store.listProgress();
    expect(rows).toHaveLength(DAY_COUNT);
    expect(rows.every((row) => row.unlocked === true)).toBe(true);
    const visited = await store.markDayVisited(12);
    expect(visited.day).toBe(12);
    expect(visited.unlocked).toBe(true);
    expect(visited.visitedAt).toBeTypeOf("number");
    expect(visited.completedAt).toBeNull();
    const completed = await store.completeDay(12);
    expect(completed.completedAt).toBeTypeOf("number");
    const undone = await store.undoDayCompletion(12);
    expect(undone.completedAt).toBeNull();
    expect(await store.loadResumeDay()).toBe(12);
  });

  it("refuses to open without IndexedDB", () => {
    const store = new LocalStore(null);
    expect(() => store.assertAvailable()).toThrow(AppError);
  });

  it("classifies quota failures without discarding context", () => {
    const quota = classifyIdbError(new DOMException("The quota has been exceeded.", "QuotaExceededError"));
    expect(quota.code).toBe("quota-exceeded");
  });
});
