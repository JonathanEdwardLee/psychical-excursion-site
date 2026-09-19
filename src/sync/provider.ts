import type { ConnectionSnapshot, SyncAttemptResult } from "../domain/sync.ts";
import type { JournalEntry, MediaRecord } from "../domain/types.ts";

export type SyncProvider = {
  readonly name: string;
  getConnection(): Promise<ConnectionSnapshot>;
  syncEntry(entry: JournalEntry, media: MediaRecord | null): Promise<SyncAttemptResult>;
  disconnect(): Promise<void>;
};
