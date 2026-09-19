import { localStore } from "../db/store.ts";
import type { SyncAttemptResult } from "../domain/sync.ts";
import type { JournalEntry } from "../domain/types.ts";
import { isGoogleSyncConfigured } from "./config.ts";
import { GoogleDriveAdapter } from "./googleDriveAdapter.ts";
import type { SyncProvider } from "./provider.ts";
import { UnconfiguredSyncProvider } from "./unconfiguredProvider.ts";

let providerOverride: SyncProvider | null = null;

export function setSyncProviderForTests(provider: SyncProvider | null): void {
  providerOverride = provider;
}

async function loadDriveSettings(): Promise<{
  accountEmail: string | null;
  driveAuthorized: boolean;
  authExpired: boolean;
}> {
  const row = await localStore.getSetting<{
    accountEmail: string | null;
    driveAuthorized: boolean;
    authExpired: boolean;
  }>("driveConnection");
  return {
    accountEmail: row?.accountEmail ?? null,
    driveAuthorized: row?.driveAuthorized ?? false,
    authExpired: row?.authExpired ?? false,
  };
}

export async function resolveSyncProvider(): Promise<SyncProvider> {
  if (providerOverride) return providerOverride;
  if (!isGoogleSyncConfigured()) return new UnconfiguredSyncProvider();
  const settings = await loadDriveSettings();
  return GoogleDriveAdapter.fromSettings(settings);
}

export async function getConnectionSnapshot() {
  const provider = await resolveSyncProvider();
  return provider.getConnection();
}

export async function afterLocalSave(entryId: string): Promise<JournalEntry | null> {
  const found = await localStore.getEntry(entryId);
  if (!found) return null;
  const provider = await resolveSyncProvider();
  const connection = await provider.getConnection();
  if (connection.kind === "not_configured") {
    return found.entry;
  }
  await localStore.updateSyncState(entryId, { syncState: "PENDING_SYNC", syncErrorCode: null });
  return attemptSync(entryId, provider);
}

async function attemptSync(entryId: string, provider: SyncProvider): Promise<JournalEntry | null> {
  const found = await localStore.getEntry(entryId);
  if (!found) return null;
  let result: SyncAttemptResult;
  try {
    result = await provider.syncEntry(found.entry, found.media);
  } catch {
    result = { ok: false, code: "network", retryable: true };
  }
  if (result.ok) {
    return localStore.updateSyncState(entryId, {
      syncState: "SYNCED",
      remoteFileId: result.remoteFileId,
      remoteVersion: result.remoteVersion,
      syncErrorCode: null,
    });
  }
  const nextState = result.retryable ? "PENDING_SYNC" : "SYNC_ERROR";
  return localStore.updateSyncState(entryId, {
    syncState: nextState,
    syncErrorCode: result.code,
  });
}

export async function retryPendingSync(): Promise<number> {
  const provider = await resolveSyncProvider();
  const entries = await localStore.listEntries();
  const pending = entries.filter((entry) => entry.syncState === "PENDING_SYNC" || entry.syncState === "SYNC_ERROR");
  let synced = 0;
  for (const entry of pending) {
    const updated = await attemptSync(entry.id, provider);
    if (updated?.syncState === "SYNCED") synced += 1;
  }
  return synced;
}

export async function disconnectDrive(): Promise<void> {
  const provider = await resolveSyncProvider();
  await provider.disconnect();
  await localStore.setSetting("driveConnection", {
    accountEmail: null,
    driveAuthorized: false,
    authExpired: false,
  });
}
