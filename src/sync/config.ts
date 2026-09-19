export type GoogleOAuthConfig = {
  clientId: string;
  scope: string;
};

const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";

export function readGoogleOAuthConfig(): GoogleOAuthConfig | null {
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID?.trim();
  if (!clientId) return null;
  return { clientId, scope: DRIVE_FILE_SCOPE };
}

export function isGoogleSyncConfigured(): boolean {
  return readGoogleOAuthConfig() !== null;
}
