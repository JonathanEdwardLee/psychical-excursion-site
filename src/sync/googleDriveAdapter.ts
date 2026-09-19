import { DRIVE_FILE_SCOPE, type ConnectionSnapshot, type SyncAttemptResult } from "../domain/sync.ts";
import type { JournalEntry, MediaRecord } from "../domain/types.ts";
import { readGoogleOAuthConfig } from "./config.ts";
import { buildRemoteMetadata } from "./driveMetadata.ts";
import { driveEntryFolderPath, driveMediaFileName, driveMetadataFileName } from "./drivePaths.ts";
import type { SyncProvider } from "./provider.ts";

export type DriveAdapterState = {
  accountEmail: string | null;
  authorized: boolean;
  authExpired: boolean;
};

/**
 * Browser-side Drive adapter preparation for drive.file scope.
 * Real OAuth token exchange is activated in a later pass when founder OAuth is configured.
 */
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
      authorized: Boolean(settings.driveAuthorized),
      authExpired: Boolean(settings.authExpired),
    });
  }

  async getConnection(): Promise<ConnectionSnapshot> {
    const config = readGoogleOAuthConfig();
    if (!config) {
      return {
        kind: "not_configured",
        googleAccountLabel: null,
        driveAuthorized: false,
        driveScope: DRIVE_FILE_SCOPE,
        message: "Google OAuth client ID is not configured for this deployment.",
      };
    }
    if (this.state.authExpired) {
      return {
        kind: "auth_expired",
        googleAccountLabel: this.state.accountEmail,
        driveAuthorized: false,
        driveScope: DRIVE_FILE_SCOPE,
        message: "Google Drive authorization expired. Local journal entries remain on this device.",
      };
    }
    if (!this.state.authorized) {
      return {
        kind: "disconnected",
        googleAccountLabel: this.state.accountEmail,
        driveAuthorized: false,
        driveScope: DRIVE_FILE_SCOPE,
        message: "Google account identity and Drive file access are separate. Connect Drive when you are ready.",
      };
    }
    return {
      kind: "ready",
      googleAccountLabel: this.state.accountEmail,
      driveAuthorized: true,
      driveScope: DRIVE_FILE_SCOPE,
      message: "Drive.file scope is prepared. Upload activation completes in the next pass.",
    };
  }

  plannedUploadPaths(entry: JournalEntry, media: MediaRecord | null): { folder: string; media: string | null; metadata: string } {
    const folder = driveEntryFolderPath(entry);
    return {
      folder,
      media: media ? `${folder}/${driveMediaFileName(entry, media.mimeType)}` : null,
      metadata: `${folder}/${driveMetadataFileName(entry)}`,
    };
  }

  buildUploadPayload(entry: JournalEntry, media: MediaRecord | null): {
    metadataJson: string;
    mediaMime: string | null;
    mediaByteLength: number | null;
  } {
    return {
      metadataJson: `${JSON.stringify(buildRemoteMetadata(entry), null, 2)}\n`,
      mediaMime: media?.mimeType ?? null,
      mediaByteLength: media?.byteLength ?? null,
    };
  }

  async syncEntry(entry: JournalEntry, media: MediaRecord | null): Promise<SyncAttemptResult> {
    const config = readGoogleOAuthConfig();
    if (!config) {
      return { ok: false, code: "not-configured", retryable: false };
    }
    if (this.state.authExpired || !this.state.authorized) {
      return { ok: false, code: "not-authorized", retryable: true };
    }
    // Upload wiring lands in the next pass; path + metadata contract is deterministic today.
    void this.plannedUploadPaths(entry, media);
    void this.buildUploadPayload(entry, media);
    return { ok: false, code: "provider", retryable: true };
  }

  async disconnect(): Promise<void> {
    this.state.authorized = false;
    this.state.authExpired = false;
    this.state.accountEmail = null;
  }
}
