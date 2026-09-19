import type { SyncAttemptResult } from "../domain/sync.ts";
import type { JournalEntry, MediaRecord } from "../domain/types.ts";
import { buildRemoteMetadata } from "./driveMetadata.ts";
import { driveMediaFileName, driveMetadataFileName } from "./drivePaths.ts";
import {
  driveUploadMultipart,
  ensurePexJournalFolder,
  type DriveFile,
} from "./googleApiClient.ts";
import { markDriveAuthExpired, requireDriveAccessToken } from "./googleAuth.ts";

const PEX_APP = "psychical-excursion";

export async function uploadJournalEntryToDrive(
  entry: JournalEntry,
  media: MediaRecord | null,
): Promise<SyncAttemptResult> {
  try {
    const accessToken = await requireDriveAccessToken();
    const year = new Date(entry.createdAt).getUTCFullYear();
    const folderId = await ensurePexJournalFolder(accessToken, year);

    const metadataJson = `${JSON.stringify(buildRemoteMetadata(entry), null, 2)}\n`;
    const metaFile = await driveUploadMultipart(accessToken, {
      name: driveMetadataFileName(entry),
      mimeType: "application/json",
      content: metadataJson,
      parentId: folderId,
      existingFileId: entry.remoteFileId,
      appProperties: {
        pex_app: PEX_APP,
        pex_kind: "metadata",
        pex_entry_id: entry.id,
      },
    });

    let mediaFile: DriveFile | null = null;
    if (media) {
      mediaFile = await driveUploadMultipart(accessToken, {
        name: driveMediaFileName(entry, media.mimeType),
        mimeType: media.mimeType,
        content: media.blob,
        parentId: folderId,
        existingFileId: entry.remoteMediaFileId,
        appProperties: {
          pex_app: PEX_APP,
          pex_kind: "media",
          pex_entry_id: entry.id,
        },
      });
    }

    return {
      ok: true,
      remoteFileId: metaFile.id,
      remoteMediaFileId: mediaFile?.id ?? null,
      remoteVersion: entry.syncVersion,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "auth-expired") {
      await markDriveAuthExpired();
      return { ok: false, code: "not-authorized", retryable: true };
    }
    if (error instanceof Error && error.message === "not-authorized") {
      return { ok: false, code: "not-authorized", retryable: true };
    }
    if (error instanceof Error && error.message === "not-configured") {
      return { ok: false, code: "not-configured", retryable: false };
    }
    return { ok: false, code: "network", retryable: true };
  }
}
