const DRIVE_TOKEN_KEY = "pex-google-drive-token";
const IDENTITY_TOKEN_KEY = "pex-google-identity-token";

export type StoredAccessToken = {
  accessToken: string;
  expiresAt: number;
  scope: string;
};

function read(key: string): StoredAccessToken | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAccessToken;
    if (!parsed.accessToken || typeof parsed.expiresAt !== "number") return null;
    if (Date.now() >= parsed.expiresAt - 30_000) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function write(key: string, token: StoredAccessToken): void {
  sessionStorage.setItem(key, JSON.stringify(token));
}

export function readDriveAccessToken(): StoredAccessToken | null {
  return read(DRIVE_TOKEN_KEY);
}

export function writeDriveAccessToken(token: StoredAccessToken): void {
  write(DRIVE_TOKEN_KEY, token);
}

export function clearDriveAccessToken(): void {
  sessionStorage.removeItem(DRIVE_TOKEN_KEY);
}

export function readIdentityAccessToken(): StoredAccessToken | null {
  return read(IDENTITY_TOKEN_KEY);
}

export function writeIdentityAccessToken(token: StoredAccessToken): void {
  write(IDENTITY_TOKEN_KEY, token);
}

export function clearIdentityAccessToken(): void {
  sessionStorage.removeItem(IDENTITY_TOKEN_KEY);
}

export function clearAllGoogleTokens(): void {
  clearDriveAccessToken();
  clearIdentityAccessToken();
}
