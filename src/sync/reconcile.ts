import { compareEntryVersions, type RemoteJournalMetadata } from "../domain/sync.ts";
import { createId, isEntryType } from "../domain/types.ts";
import { localStore } from "../db/store.ts";
import {
  driveDownloadFile,
  driveListChildren,
  listPexJournalYearFolders,
} from "./googleApiClient.ts";
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
    const yearFolders = await listPexJournalYearFolders(accessToken);
    const localEntries = await localStore.listEntries();
    const localById = new Map(localEntries.map((entry) => [entry.id, entry]));

    for (const { folderId } of yearFolders) {
      const files = await driveListChildren(accessToken, folderId);
      const metadataFiles = files.filter((file) => file.appProperties?.pex_kind === "metadata");

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
          localById.set(entryId, (await localStore.getEntry(entryId))!.entry);
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
  let remoteMediaFileId: string | null = null;
  if (remote.media_mime) {
    const files = await driveListChildren(accessToken, folderId);
    const mediaFile = files.find(
      (file) => file.appProperties?.pex_entry_id === remote.entry_id && file.appProperties?.pex_kind === "media",
    );
    if (mediaFile) {
      remoteMediaFileId = mediaFile.id;
      const bytes = await driveDownloadFile(accessToken, mediaFile.id);
      media = {
        id: createId("audio"),
        blob: new Blob([bytes], { type: remote.media_mime }),
        mimeType: remote.media_mime,
      };
    }
  }
  await localStore.saveCapture({
    id: remote.entry_id,
    type: remote.capture_type,
    note: remote.note,
    createdAt,
    pexDay: remote.pex_day,
    phaseId: remote.phase,
    audio: media,
    syncState: "SYNCED",
    syncVersion: remote.sync_version,
    remoteVersion: remote.sync_version,
    remoteFileId: metadataFileId,
    remoteMediaFileId,
  });
}
