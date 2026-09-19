import { compareEntryVersions, type RemoteJournalMetadata } from "../domain/sync.ts";
import { createId, isEntryType, normalizeJournalEntry, type JournalEntry } from "../domain/types.ts";
import { localStore } from "../db/store.ts";
import { driveDownloadFile, driveListChildren, ensurePexJournalFolder } from "./googleApiClient.ts";
import { markDriveAuthExpired, requireDriveAccessToken } from "./googleAuth.ts";

export type ReconcileSummary = {
  imported: number;
  skipped: number;
  conflicts: number;
};

export async function reconcileJournalFromDrive(): Promise<ReconcileSummary> {
  const summary: ReconcileSummary = { imported: 0, skipped: 0, conflicts: 0 };
  try {
    const accessToken = await requireDriveAccessToken();
    const year = new Date().getUTCFullYear();
    const folderId = await ensurePexJournalFolder(accessToken, year);
    const files = await driveListChildren(accessToken, folderId);
    const metadataFiles = files.filter((file) => file.appProperties?.pex_kind === "metadata");
    const localEntries = await localStore.listEntries();
    const localById = new Map(localEntries.map((entry) => [entry.id, entry]));

    for (const file of metadataFiles) {
      const entryId = file.appProperties?.pex_entry_id;
      if (!entryId) {
        summary.skipped += 1;
        continue;
      }
      const buffer = await driveDownloadFile(accessToken, file.id);
      const remote = JSON.parse(new TextDecoder().decode(buffer)) as RemoteJournalMetadata;
      if (!isEntryType(remote.capture_type)) {
        summary.skipped += 1;
        continue;
      }
      const local = localById.get(entryId);
      const remoteVersion = remote.sync_version;
      if (!local) {
        await importRemoteEntry(remote, file.id, accessToken, folderId);
        summary.imported += 1;
        continue;
      }
      const resolution = compareEntryVersions(local, remoteVersion);
      if (resolution === "keep_local") {
        summary.skipped += 1;
        continue;
      }
      if (resolution === "manual_required") {
        await localStore.updateSyncState(entryId, {
          syncState: "SYNC_ERROR",
          syncErrorCode: "conflict-manual",
        });
        summary.conflicts += 1;
        continue;
      }
      summary.skipped += 1;
    }
    return summary;
  } catch (error) {
    if (error instanceof Error && error.message === "auth-expired") {
      await markDriveAuthExpired();
    }
    throw error;
  }
}

async function importRemoteEntry(
  remote: RemoteJournalMetadata,
  metadataFileId: string,
  accessToken: string,
  folderId: string,
): Promise<void> {
  const createdAt = Date.parse(remote.captured_at);
  let media: { id: string; blob: Blob; mimeType: string } | null = null;
  if (remote.media_mime) {
    const files = await driveListChildren(accessToken, folderId);
    const mediaFile = files.find(
      (file) => file.appProperties?.pex_entry_id === remote.entry_id && file.appProperties?.pex_kind === "media",
    );
    if (mediaFile) {
      const bytes = await driveDownloadFile(accessToken, mediaFile.id);
      media = {
        id: createId("audio"),
        blob: new Blob([bytes], { type: remote.media_mime }),
        mimeType: remote.media_mime,
      };
    }
  }
  const entry: JournalEntry = normalizeJournalEntry({
    id: remote.entry_id,
    type: remote.capture_type,
    createdAt,
    updatedAt: createdAt,
    note: remote.note,
    audioId: media?.id ?? null,
    audioMimeType: media?.mimeType ?? null,
    audioByteLength: media?.blob.size ?? null,
    syncState: "SYNCED",
    localSafeAt: Date.now(),
    syncVersion: remote.sync_version,
    remoteVersion: remote.sync_version,
    remoteFileId: metadataFileId,
    remoteMediaFileId: null,
    pexDay: remote.pex_day,
    phaseId: remote.phase,
  });
  await localStore.saveCapture({
    id: entry.id,
    type: entry.type,
    note: entry.note,
    createdAt: entry.createdAt,
    pexDay: entry.pexDay,
    phaseId: entry.phaseId,
    audio: media,
    syncState: "SYNCED",
    syncVersion: remote.sync_version,
    remoteVersion: remote.sync_version,
    remoteFileId: metadataFileId,
  });
}
