import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { localStore } from "../db/store.ts";
import { DB_NAME } from "../domain/types.ts";
import { MockSyncProvider } from "./mockProvider.ts";
import { afterLocalSave, retryPendingSync, setSyncProviderForTests } from "./syncEngine.ts";

async function resetDb(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("reset failed"));
    request.onblocked = () => resolve();
  });
}

describe("sync engine", () => {
  let mock: MockSyncProvider;

  beforeEach(async () => {
    await resetDb();
    mock = new MockSyncProvider();
    setSyncProviderForTests(mock);
  });

  afterEach(() => {
    setSyncProviderForTests(null);
  });

  it("marks pending sync after local save when provider fails, then syncs without duplicates on retry", async () => {
    mock.failNext = true;
    const blob = new Blob([new Uint8Array([1, 2])], { type: "audio/webm" });
    const saved = await localStore.saveCapture({
      id: "entry-sync-1",
      type: "dream",
      note: "",
      createdAt: Date.now(),
      audio: { id: "audio-sync-1", blob, mimeType: "audio/webm" },
    });
    const pending = await afterLocalSave(saved.id);
    expect(pending?.syncState).toBe("PENDING_SYNC");
    expect(mock.uploadCount(saved.id)).toBe(0);

    const syncedCount = await retryPendingSync();
    expect(syncedCount).toBe(1);
    const after = await localStore.getEntry(saved.id);
    expect(after?.entry.syncState).toBe("SYNCED");
    expect(mock.uploadCount(saved.id)).toBe(1);

    await retryPendingSync();
    expect(mock.uploadCount(saved.id)).toBe(1);
  });
});
