import { DRIVE_FILE_SCOPE, type ConnectionSnapshot, type SyncAttemptResult } from "../domain/sync.ts";
import type { JournalEntry, MediaRecord } from "../domain/types.ts";
import type { SyncProvider } from "./provider.ts";

export class MockSyncProvider implements SyncProvider {
  readonly name = "mock";
  private readonly uploaded = new Map<string, number>();
  failNext = false;
  unauthorized = false;

  async getConnection(): Promise<ConnectionSnapshot> {
    if (this.unauthorized) {
      return {
        kind: "auth_expired",
        googleAccountLabel: "mock@example.com",
        driveAuthorized: false,
        driveScope: DRIVE_FILE_SCOPE,
        message: "Mock auth expired",
      };
    }
    return {
      kind: "ready",
      googleAccountLabel: "mock@example.com",
      driveAuthorized: true,
      driveScope: DRIVE_FILE_SCOPE,
      message: "Mock provider ready",
    };
  }

  async syncEntry(entry: JournalEntry, _media: MediaRecord | null): Promise<SyncAttemptResult> {
    if (this.unauthorized) {
      return { ok: false, code: "not-authorized", retryable: true };
    }
    if (this.failNext) {
      this.failNext = false;
      return { ok: false, code: "network", retryable: true };
    }
    if (this.uploaded.has(entry.id)) {
      const version = this.uploaded.get(entry.id)!;
      return { ok: true, remoteFileId: `mock-file-${entry.id}`, remoteVersion: version };
    }
    const version = entry.syncVersion;
    this.uploaded.set(entry.id, version);
    return { ok: true, remoteFileId: `mock-file-${entry.id}`, remoteVersion: version };
  }

  async disconnect(): Promise<void> {
    this.unauthorized = true;
  }

  uploadCount(entryId: string): number {
    return this.uploaded.has(entryId) ? 1 : 0;
  }
}
