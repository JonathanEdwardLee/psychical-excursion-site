import { SCHEMA_VERSION, type JournalEntry } from "../domain/types.ts";
import type { RemoteJournalMetadata } from "../domain/sync.ts";

export function buildRemoteMetadata(entry: JournalEntry): RemoteJournalMetadata {
  return {
    schema_version: SCHEMA_VERSION,
    entry_id: entry.id,
    captured_at: new Date(entry.createdAt).toISOString(),
    capture_type: entry.type,
    pex_day: entry.pexDay,
    phase: entry.phaseId,
    note: entry.note,
    media_mime: entry.audioMimeType,
    sync_state: entry.syncState,
    sync_version: entry.syncVersion,
    remote_version: entry.remoteVersion,
  };
}
