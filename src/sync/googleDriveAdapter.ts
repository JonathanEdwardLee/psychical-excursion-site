import { DRIVE_FILE_SCOPE, type ConnectionSnapshot, type SyncAttemptResult } from "../domain/sync.ts";
import type { JournalEntry, MediaRecord } from "../domain/types.ts";
import { localStore } from "../db/store.ts";
import { readGoogleOAuthConfig } from "./config.ts";
import { uploadJournalEntryToDrive } from "./driveUpload.ts";
import { loadGoogleIdentityState } from "./googleAuth.ts";
import type { SyncProvider } from "./provider.ts";

export type DriveAdapterState = {
  accountEmail: string | null;
  driveAuthorized: boolean;
  authExpired: boolean;
};

export class GoogleDriveAdapter implements SyncProvider {
  readonly name = "google-drive";

  constructor(private readonly state: DriveAdapterState) {}

  static fromSettings(settings: {
    accountEmail?: string | null;
    driveAuthorized?: boolean;
    authExpired?: boolean;
  }): GoogleDriveAdapter {
    return new GoogleDriveAdapter({
      accountEmail: settings.accountEmail ?? null,
      driveAuthorized: Boolean(settings.driveAuthorized),
      authExpired: Boolean(settings.authExpired),
    });
  }

  async getConnection(): Promise<ConnectionSnapshot> {
    const config = readGoogleOAuthConfig();
    const entries = await localStore.listEntries();
    const pendingSyncCount = entries.filter(
      (entry) => entry.syncState === "PENDING_SYNC" || entry.syncState === "SYNC_ERROR",
    ).length;
    const identity = await loadGoogleIdentityState();

    if (!config) {
      return {
        kind: "not_configured",
        googleAccountLabel: null,
        googleSignedIn: false,
        driveAuthorized: false,
        driveScope: DRIVE_FILE_SCOPE,
        message: "Google OAuth client ID is not configured for this deployment.",
        pendingSyncCount,
      };
    }
    if (this.state.authExpired) {
      return {
        kind: "auth_expired",
        googleAccountLabel: this.state.accountEmail ?? identity.email,
        googleSignedIn: identity.signedIn,
        driveAuthorized: false,
        driveScope: DRIVE_FILE_SCOPE,
        message: "Google Drive authorization expired. Local journal entries remain on this device.",
        pendingSyncCount,
      };
    }
    if (!identity.signedIn) {
      return {
        kind: "local_only",
        googleAccountLabel: null,
        googleSignedIn: false,
        driveAuthorized: false,
        driveScope: DRIVE_FILE_SCOPE,
        message: "Local-only mode. Sign in with Google only if you want optional sync.",
        pendingSyncCount,
      };
    }
    if (!this.state.driveAuthorized) {
      return {
        kind: "google_signed_in",
        googleAccountLabel: identity.email,
        googleSignedIn: true,
        driveAuthorized: false,
        driveScope: DRIVE_FILE_SCOPE,
        message: "Signed in to Google. Journal stays on this device until you connect Drive separately.",
        pendingSyncCount,
      };
    }
    if (pendingSyncCount > 0) {
      return {
        kind: "sync_error",
        googleAccountLabel: identity.email,
        googleSignedIn: true,
        driveAuthorized: true,
        driveScope: DRIVE_FILE_SCOPE,
        message: `${pendingSyncCount} entr${pendingSyncCount === 1 ? "y" : "ies"} waiting to sync. Local copies are safe.`,
        pendingSyncCount,
      };
    }
    return {
      kind: "drive_connected",
      googleAccountLabel: identity.email,
      googleSignedIn: true,
      driveAuthorized: true,
      driveScope: DRIVE_FILE_SCOPE,
      message: "Drive connected with drive.file scope. Sync runs after each local-safe save.",
      pendingSyncCount,
    };
  }

  async syncEntry(entry: JournalEntry, media: MediaRecord | null): Promise<SyncAttemptResult> {
    const config = readGoogleOAuthConfig();
    if (!config) {
      return { ok: false, code: "not-configured", retryable: false };
    }
    if (this.state.authExpired || !this.state.driveAuthorized) {
      return { ok: false, code: "not-authorized", retryable: true };
    }
    return uploadJournalEntryToDrive(entry, media);
  }

  async disconnect(): Promise<void> {
    this.state.driveAuthorized = false;
    this.state.authExpired = false;
  }
}
