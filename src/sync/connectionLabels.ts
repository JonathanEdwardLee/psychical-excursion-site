import type { ConnectionKind } from "../domain/sync.ts";

export function connectionHeadline(kind: ConnectionKind): string {
  switch (kind) {
    case "local_only":
      return "Local only";
    case "not_configured":
      return "Google not configured";
    case "google_signed_in":
      return "Signed in · Drive disconnected";
    case "drive_connected":
      return "Drive connected";
    case "auth_expired":
      return "Authorization expired";
    case "sync_error":
      return "Pending sync";
    case "disconnected":
      return "Drive disconnected";
    default:
      return "Connection";
  }
}
