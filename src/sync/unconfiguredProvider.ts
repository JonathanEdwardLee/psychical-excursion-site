import { DRIVE_FILE_SCOPE, type ConnectionSnapshot, type SyncAttemptResult } from "../domain/sync.ts";
import type { JournalEntry, MediaRecord } from "../domain/types.ts";
import type { SyncProvider } from "./provider.ts";

export class UnconfiguredSyncProvider implements SyncProvider {
  readonly name = "unconfigured";

  async getConnection(): Promise<ConnectionSnapshot> {
    return {
      kind: "not_configured",
      googleAccountLabel: null,
      driveAuthorized: false,
      driveScope: DRIVE_FILE_SCOPE,
      message:
        "Google connection is not configured for this build. Journal capture and export work locally without Google.",
    };
  }

  async syncEntry(_entry: JournalEntry, _media: MediaRecord | null): Promise<SyncAttemptResult> {
    return { ok: false, code: "not-configured", retryable: false };
  }

  async disconnect(): Promise<void> {}
}
