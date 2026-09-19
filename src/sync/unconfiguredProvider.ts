import { DRIVE_FILE_SCOPE, type ConnectionSnapshot, type SyncAttemptResult } from "../domain/sync.ts";
import type { JournalEntry, MediaRecord } from "../domain/types.ts";
import { localStore } from "../db/store.ts";
import type { SyncProvider } from "./provider.ts";

export class UnconfiguredSyncProvider implements SyncProvider {
  readonly name = "unconfigured";

  async getConnection(): Promise<ConnectionSnapshot> {
    const entries = await localStore.listEntries();
    const pendingSyncCount = entries.filter(
      (entry) => entry.syncState === "PENDING_SYNC" || entry.syncState === "SYNC_ERROR",
    ).length;
    return {
      kind: "not_configured",
      googleAccountLabel: null,
      googleSignedIn: false,
      driveAuthorized: false,
      driveScope: DRIVE_FILE_SCOPE,
      message:
        "Google connection is not configured for this build. Journal capture and export work locally without Google.",
      pendingSyncCount,
    };
  }

  async syncEntry(_entry: JournalEntry, _media: MediaRecord | null): Promise<SyncAttemptResult> {
    return { ok: false, code: "not-configured", retryable: false };
  }

  async disconnect(): Promise<void> {}
}
