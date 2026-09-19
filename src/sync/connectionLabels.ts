import type { ConnectionKind } from "../domain/sync.ts";

export function connectionHeadline(kind: ConnectionKind): string {
  switch (kind) {
    case "local_only":
      return "Saved on this device";
    case "not_configured":
      return "Google backup not available here";
    case "google_signed_in":
      return "Signed in · Drive not connected";
    case "drive_connected":
      return "Google Drive connected";
    case "auth_expired":
      return "Sign in again";
    case "sync_error":
      return "Backup waiting";
    case "disconnected":
      return "Google Drive disconnected";
    default:
      return "Connection";
  }
}
