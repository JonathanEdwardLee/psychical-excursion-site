import type { EntryType, JournalEntry, SyncState } from "./types.ts";

export { SYNC_STATES, type SyncState } from "./types.ts";

export const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";

export type ConnectionKind = "local_only" | "not_configured" | "disconnected" | "ready" | "auth_expired";

export type ConnectionSnapshot = {
  kind: ConnectionKind;
  googleAccountLabel: string | null;
  driveAuthorized: boolean;
  driveScope: typeof DRIVE_FILE_SCOPE;
  message: string;
};

export type RemoteJournalMetadata = {
  schema_version: number;
  entry_id: string;
  captured_at: string;
  capture_type: EntryType;
  pex_day: number | null;
  phase: string | null;
  note: string;
  media_mime: string | null;
  sync_state: SyncState;
  sync_version: number;
  remote_version: number | null;
};

export type SyncAttemptResult =
  | { ok: true; remoteFileId: string; remoteVersion: number }
  | { ok: false; code: "not-configured" | "not-authorized" | "network" | "provider"; retryable: boolean };

/**
 * Cross-device conflict model (preparation only — not live multi-device sync in V2A):
 * - Stable entry_id is the primary key everywhere.
 * - sync_version increments on each local mutation; remote_version tracks last known remote.
 * - Journal is append-safe: entries are never merged by timestamp alone.
 * - On conflict: higher sync_version wins for note text; media is immutable per entry_id unless explicitly replaced.
 * - Local IndexedDB copy is never silently deleted or overwritten by a remote fetch in this phase.
 */
export type ConflictResolution = "keep_local" | "keep_remote" | "manual_required";

export function compareEntryVersions(local: JournalEntry, remoteVersion: number): ConflictResolution {
  const localVer = local.syncVersion;
  if (remoteVersion === local.remoteVersion) return "keep_local";
  if (remoteVersion > localVer) return "manual_required";
  return "keep_local";
}
