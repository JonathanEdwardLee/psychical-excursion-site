import { localStore } from "../db/store.ts";
import { DRIVE_FILE_SCOPE } from "../domain/sync.ts";
import { readGoogleOAuthConfig } from "./config.ts";
import { googleApiFetch } from "./googleApiClient.ts";
import {
  clearAllGoogleTokens,
  clearDriveAccessToken,
  readDriveAccessToken,
  writeDriveAccessToken,
  writeIdentityAccessToken,
  type StoredAccessToken,
} from "./googleTokens.ts";

export type GoogleIdentityState = {
  email: string | null;
  signedIn: boolean;
  signedInAt: number | null;
};

type TokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

type GoogleAccounts = {
  oauth2: {
    initTokenClient: (options: {
      client_id: string;
      scope: string;
      callback: (response: { access_token?: string; expires_in?: number; error?: string }) => void;
    }) => TokenClient;
  };
};

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

let scriptPromise: Promise<void> | null = null;

export function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-pex-gis="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("gis-load-failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.pexGis = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("gis-load-failed"));
    document.head.append(script);
  });
  return scriptPromise;
}

function requestToken(scope: string, prompt?: "" | "consent"): Promise<StoredAccessToken> {
  const config = readGoogleOAuthConfig();
  if (!config) return Promise.reject(new Error("not-configured"));
  return loadGoogleIdentityScript().then(
    () =>
      new Promise((resolve, reject) => {
        const client = window.google!.accounts.oauth2.initTokenClient({
          client_id: config.clientId,
          scope,
          callback: (response) => {
            if (response.error || !response.access_token) {
              reject(new Error(response.error ?? "token-denied"));
              return;
            }
            const expiresIn = response.expires_in ?? 3600;
            resolve({
              accessToken: response.access_token,
              expiresAt: Date.now() + expiresIn * 1000,
              scope,
            });
          },
        });
        client.requestAccessToken(prompt ? { prompt } : {});
      }),
  );
}

export async function loadGoogleIdentityState(): Promise<GoogleIdentityState> {
  const stored = await localStore.getSetting<GoogleIdentityState>("googleIdentity");
  return {
    email: stored?.email ?? null,
    signedIn: Boolean(stored?.signedIn),
    signedInAt: stored?.signedInAt ?? null,
  };
}

export async function requestGoogleAccessToken(
  scope: string,
  prompt?: "" | "consent",
): Promise<StoredAccessToken> {
  return requestToken(scope, prompt);
}

export async function signInWithGoogle(): Promise<GoogleIdentityState> {
  const token = await requestToken("openid email profile", "consent");
  writeIdentityAccessToken(token);
  const email = await fetchGoogleEmail(token.accessToken);
  const identity: GoogleIdentityState = {
    email,
    signedIn: true,
    signedInAt: Date.now(),
  };
  await localStore.setSetting("googleIdentity", identity);
  const drive = await localStore.getSetting<{ accountEmail: string | null; driveAuthorized: boolean; authExpired: boolean }>(
    "driveConnection",
  );
  await localStore.setSetting("driveConnection", {
    accountEmail: email,
    driveAuthorized: drive?.driveAuthorized ?? false,
    authExpired: false,
  });
  return identity;
}

async function fetchGoogleEmail(accessToken: string): Promise<string> {
  const response = await googleApiFetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("identity-profile-failed");
  const data = (await response.json()) as { email?: string };
  if (!data.email) throw new Error("identity-email-missing");
  return data.email;
}

export async function signOutGoogle(): Promise<void> {
  clearAllGoogleTokens();
  await localStore.setSetting("googleIdentity", { email: null, signedIn: false, signedInAt: null });
  await localStore.setSetting("driveConnection", {
    accountEmail: null,
    driveAuthorized: false,
    authExpired: false,
  });
}

export async function connectGoogleDrive(): Promise<void> {
  const identity = await loadGoogleIdentityState();
  if (!identity.signedIn) throw new Error("sign-in-required");
  const token = await requestToken(DRIVE_FILE_SCOPE, "consent");
  writeDriveAccessToken(token);
  await localStore.setSetting("driveConnection", {
    accountEmail: identity.email,
    driveAuthorized: true,
    authExpired: false,
  });
}

export async function disconnectGoogleDriveOnly(): Promise<void> {
  clearDriveAccessToken();
  const identity = await loadGoogleIdentityState();
  await localStore.setSetting("driveConnection", {
    accountEmail: identity.email,
    driveAuthorized: false,
    authExpired: false,
  });
}

export async function requireDriveAccessToken(): Promise<string> {
  const stored = readDriveAccessToken();
  if (stored) return stored.accessToken;
  const connection = await localStore.getSetting<{ driveAuthorized: boolean }>("driveConnection");
  if (!connection?.driveAuthorized) throw new Error("not-authorized");
  await connectGoogleDrive();
  const next = readDriveAccessToken();
  if (!next) throw new Error("not-authorized");
  return next.accessToken;
}

export async function markDriveAuthExpired(): Promise<void> {
  clearDriveAccessToken();
  const identity = await loadGoogleIdentityState();
  await localStore.setSetting("driveConnection", {
    accountEmail: identity.email,
    driveAuthorized: false,
    authExpired: true,
  });
}
