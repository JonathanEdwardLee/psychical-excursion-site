import {
  APP_VERSION,
  AppError,
  DAY_COUNT,
  DB_NAME,
  DB_VERSION,
  SCHEMA_VERSION,
  STORES,
  type DayProgress,
  type JournalEntry,
  type MediaRecord,
  type PersistenceReport,
} from "../domain/types.ts";

export type DatabaseFactory = typeof indexedDB;

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("indexeddb-request-failed"));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("indexeddb-transaction-failed"));
    tx.onabort = () => reject(tx.error ?? new Error("indexeddb-transaction-aborted"));
  });
}

export function classifyIdbError(error: unknown): AppError {
  const name = error instanceof DOMException ? error.name : "";
  const message = error instanceof Error ? error.message : String(error);
  if (name === "QuotaExceededError" || /quota/i.test(message)) {
    return new AppError(
      "quota-exceeded",
      "This browser does not have enough space to save. Export existing entries if you can, then free space and retry.",
    );
  }
  return new AppError("save-failed", "The local save did not complete. Your entry was not discarded silently; retry the save.");
}

export class LocalStore {
  constructor(private readonly factory: DatabaseFactory | null = globalThis.indexedDB ?? null) {}

  assertAvailable(): void {
    if (!this.factory) {
      throw new AppError(
        "indexeddb-unavailable",
        "IndexedDB is not available in this browser, so journal entries cannot be stored locally.",
        false,
      );
    }
  }

  async open(): Promise<IDBDatabase> {
    this.assertAvailable();
    try {
      const request = this.factory!.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORES.entries)) {
          const entries = db.createObjectStore(STORES.entries, { keyPath: "id" });
          entries.createIndex("createdAt", "createdAt");
          entries.createIndex("type", "type");
        }
        if (!db.objectStoreNames.contains(STORES.media)) {
          const media = db.createObjectStore(STORES.media, { keyPath: "id" });
          media.createIndex("entryId", "entryId", { unique: true });
        }
        if (!db.objectStoreNames.contains(STORES.progress)) {
          db.createObjectStore(STORES.progress, { keyPath: "day" });
        }
        if (!db.objectStoreNames.contains(STORES.settings)) {
          db.createObjectStore(STORES.settings, { keyPath: "key" });
        }
      };
      const db = await requestToPromise(request);
      await this.ensureSeed(db);
      return db;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("indexeddb-open-failed", "The local database could not be opened.", false);
    }
  }

  private async ensureSeed(db: IDBDatabase): Promise<void> {
    const tx = db.transaction([STORES.progress, STORES.settings], "readwrite");
    const progress = tx.objectStore(STORES.progress);
    const settings = tx.objectStore(STORES.settings);
    for (let day = 1; day <= DAY_COUNT; day += 1) {
      const existing = await requestToPromise(progress.get(day));
      if (!existing) {
        const record: DayProgress = { day, unlocked: true, visitedAt: null };
        progress.put(record);
      } else if (existing.unlocked !== true) {
        progress.put({ ...existing, unlocked: true });
      }
    }
    const schema = await requestToPromise(settings.get("schema"));
    if (!schema) {
      settings.put({
        key: "schema",
        schemaVersion: SCHEMA_VERSION,
        appVersion: APP_VERSION,
        createdAt: Date.now(),
      });
    }
    await transactionDone(tx);
  }

  async listEntries(): Promise<JournalEntry[]> {
    const db = await this.open();
    try {
      const tx = db.transaction(STORES.entries, "readonly");
      const store = tx.objectStore(STORES.entries);
      const rows = (await requestToPromise(store.getAll())) as JournalEntry[];
      await transactionDone(tx);
      return rows.sort((a, b) => b.createdAt - a.createdAt);
    } finally {
      db.close();
    }
  }

  async getEntry(id: string): Promise<{ entry: JournalEntry; media: MediaRecord | null } | null> {
    const db = await this.open();
    try {
      const tx = db.transaction([STORES.entries, STORES.media], "readonly");
      const entry = (await requestToPromise(tx.objectStore(STORES.entries).get(id))) as JournalEntry | undefined;
      if (!entry) {
        await transactionDone(tx);
        return null;
      }
      let media: MediaRecord | null = null;
      if (entry.audioId) {
        media = ((await requestToPromise(tx.objectStore(STORES.media).get(entry.audioId))) as MediaRecord | undefined) ?? null;
      }
      await transactionDone(tx);
      return { entry, media };
    } finally {
      db.close();
    }
  }

  async saveCapture(input: {
    id: string;
    type: JournalEntry["type"];
    note: string;
    createdAt: number;
    audio: { id: string; blob: Blob; mimeType: string } | null;
  }): Promise<JournalEntry> {
    const db = await this.open();
    const entry: JournalEntry = {
      id: input.id,
      type: input.type,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
      note: input.note.trim(),
      audioId: input.audio?.id ?? null,
      audioMimeType: input.audio?.mimeType ?? null,
      audioByteLength: input.audio ? input.audio.blob.size : null,
    };
    try {
      const tx = db.transaction(
        input.audio ? [STORES.entries, STORES.media] : STORES.entries,
        "readwrite",
      );
      tx.objectStore(STORES.entries).put(entry);
      if (input.audio) {
        const media: MediaRecord = {
          id: input.audio.id,
          entryId: entry.id,
          mimeType: input.audio.mimeType,
          blob: input.audio.blob,
          byteLength: input.audio.blob.size,
          createdAt: input.createdAt,
        };
        tx.objectStore(STORES.media).put(media);
      }
      await transactionDone(tx);
      return entry;
    } catch (error) {
      throw classifyIdbError(error);
    } finally {
      db.close();
    }
  }

  async updateNote(id: string, note: string): Promise<JournalEntry> {
    const db = await this.open();
    try {
      const tx = db.transaction(STORES.entries, "readwrite");
      const store = tx.objectStore(STORES.entries);
      const existing = (await requestToPromise(store.get(id))) as JournalEntry | undefined;
      if (!existing) {
        throw new AppError("save-failed", "That entry is no longer in local storage.");
      }
      const next: JournalEntry = { ...existing, note: note.trim(), updatedAt: Date.now() };
      store.put(next);
      await transactionDone(tx);
      return next;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw classifyIdbError(error);
    } finally {
      db.close();
    }
  }

  async deleteEntry(id: string): Promise<void> {
    const db = await this.open();
    try {
      const tx = db.transaction([STORES.entries, STORES.media], "readwrite");
      const entry = (await requestToPromise(tx.objectStore(STORES.entries).get(id))) as JournalEntry | undefined;
      if (entry?.audioId) {
        tx.objectStore(STORES.media).delete(entry.audioId);
      }
      tx.objectStore(STORES.entries).delete(id);
      await transactionDone(tx);
    } catch {
      throw new AppError("delete-failed", "The entry could not be deleted. It should still be present in the journal.");
    } finally {
      db.close();
    }
  }

  async listProgress(): Promise<DayProgress[]> {
    const db = await this.open();
    try {
      const tx = db.transaction(STORES.progress, "readonly");
      const rows = (await requestToPromise(tx.objectStore(STORES.progress).getAll())) as DayProgress[];
      await transactionDone(tx);
      return rows.sort((a, b) => a.day - b.day);
    } finally {
      db.close();
    }
  }

  async markDayVisited(day: number): Promise<DayProgress> {
    const db = await this.open();
    try {
      const tx = db.transaction(STORES.progress, "readwrite");
      const store = tx.objectStore(STORES.progress);
      const existing = ((await requestToPromise(store.get(day))) as DayProgress | undefined) ?? {
        day,
        unlocked: true as const,
        visitedAt: null,
      };
      const next: DayProgress = { ...existing, unlocked: true, visitedAt: Date.now() };
      store.put(next);
      await transactionDone(tx);
      return next;
    } catch (error) {
      throw classifyIdbError(error);
    } finally {
      db.close();
    }
  }

  async getSetting<T>(key: string): Promise<T | undefined> {
    const db = await this.open();
    try {
      const tx = db.transaction(STORES.settings, "readonly");
      const row = (await requestToPromise(tx.objectStore(STORES.settings).get(key))) as { key: string; value: T } | undefined;
      await transactionDone(tx);
      return row?.value;
    } finally {
      db.close();
    }
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    const db = await this.open();
    try {
      const tx = db.transaction(STORES.settings, "readwrite");
      tx.objectStore(STORES.settings).put({ key, value });
      await transactionDone(tx);
    } catch (error) {
      throw classifyIdbError(error);
    } finally {
      db.close();
    }
  }

  async getSchemaInfo(): Promise<{ schemaVersion: number; appVersion: string; createdAt: number } | undefined> {
    const db = await this.open();
    try {
      const tx = db.transaction(STORES.settings, "readonly");
      const row = (await requestToPromise(tx.objectStore(STORES.settings).get("schema"))) as
        | { schemaVersion: number; appVersion: string; createdAt: number }
        | undefined;
      await transactionDone(tx);
      return row;
    } finally {
      db.close();
    }
  }

  async savePersistenceReport(report: PersistenceReport): Promise<void> {
    await this.setSetting("persistenceReport", report);
  }

  async loadPersistenceReport(): Promise<PersistenceReport | undefined> {
    return this.getSetting<PersistenceReport>("persistenceReport");
  }

  async exportBundle(): Promise<{ entries: JournalEntry[]; media: MediaRecord[] }> {
    const db = await this.open();
    try {
      const tx = db.transaction([STORES.entries, STORES.media], "readonly");
      const entries = (await requestToPromise(tx.objectStore(STORES.entries).getAll())) as JournalEntry[];
      const media = (await requestToPromise(tx.objectStore(STORES.media).getAll())) as MediaRecord[];
      await transactionDone(tx);
      return {
        entries: entries.sort((a, b) => a.createdAt - b.createdAt),
        media,
      };
    } finally {
      db.close();
    }
  }
}

export const localStore = new LocalStore();
