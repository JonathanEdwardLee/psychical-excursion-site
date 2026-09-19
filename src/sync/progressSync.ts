import { DAY_COUNT, type DayProgress } from "../domain/types.ts";
import { localStore } from "../db/store.ts";
import { driveDownloadFile, driveUploadMultipart, ensurePexJournalFolder } from "./googleApiClient.ts";
import { markDriveAuthExpired, requireDriveAccessToken } from "./googleAuth.ts";

export type RemoteProgressSnapshot = {
  schema_version: number;
  sync_version: number;
  resume_day: number;
  completed_days: number[];
  updated_at: string;
};

const PROGRESS_FILE = "pex-progress.json";

export async function uploadProgressToDrive(): Promise<void> {
  try {
    const accessToken = await requireDriveAccessToken();
    const folderId = await ensurePexJournalFolder(accessToken, new Date().getUTCFullYear());
    const rows = await localStore.listProgress();
    const completed = rows.filter((row) => row.completedAt).map((row) => row.day);
    const resume = (await localStore.loadResumeDay()) ?? 1;
    const existing = await localStore.getSetting<{ syncVersion: number; remoteFileId: string | null }>("progressSync");
    const snapshot: RemoteProgressSnapshot = {
      schema_version: 1,
      sync_version: (existing?.syncVersion ?? 0) + 1,
      resume_day: resume,
      completed_days: completed,
      updated_at: new Date().toISOString(),
    };
    const file = await driveUploadMultipart(accessToken, {
      name: PROGRESS_FILE,
      mimeType: "application/json",
      content: `${JSON.stringify(snapshot, null, 2)}\n`,
      parentId: folderId,
      existingFileId: existing?.remoteFileId ?? null,
      appProperties: { pex_app: "psychical-excursion", pex_kind: "progress" },
    });
    await localStore.setSetting("progressSync", {
      syncVersion: snapshot.sync_version,
      remoteFileId: file.id,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "auth-expired") {
      await markDriveAuthExpired();
    }
    throw error;
  }
}

export async function reconcileProgressFromDrive(): Promise<void> {
  try {
    const accessToken = await requireDriveAccessToken();
    await ensurePexJournalFolder(accessToken, new Date().getUTCFullYear());
    const localMeta = await localStore.getSetting<{ syncVersion: number; remoteFileId: string | null }>("progressSync");
    if (!localMeta?.remoteFileId) return;
    const buffer = await driveDownloadFile(accessToken, localMeta.remoteFileId);
    const remote = JSON.parse(new TextDecoder().decode(buffer)) as RemoteProgressSnapshot;
    if (remote.sync_version <= (localMeta.syncVersion ?? 0)) return;
    for (const day of remote.completed_days) {
      if (day >= 1 && day <= DAY_COUNT) {
        await localStore.completeDay(day);
      }
    }
    if (remote.resume_day >= 1 && remote.resume_day <= DAY_COUNT) {
      await localStore.setSetting("resumeDay", remote.resume_day);
    }
    await localStore.setSetting("progressSync", {
      syncVersion: remote.sync_version,
      remoteFileId: localMeta.remoteFileId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "auth-expired") {
      await markDriveAuthExpired();
    }
    throw error;
  }
}

export function mergeProgressDeterministic(local: DayProgress[], remote: RemoteProgressSnapshot): RemoteProgressSnapshot {
  const completed = new Set<number>();
  local.forEach((row) => {
    if (row.completedAt) completed.add(row.day);
  });
  remote.completed_days.forEach((day) => completed.add(day));
  return {
    ...remote,
    completed_days: Array.from(completed).sort((a, b) => a - b),
  };
}
