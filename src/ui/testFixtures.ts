import { localStore } from "../db/store.ts";

export async function fixtureSignIn(email = "fixture@example.com"): Promise<void> {
  await localStore.setSetting("googleIdentity", {
    email,
    signedIn: true,
    signedInAt: Date.now(),
  });
}

export async function fixtureSignOut(): Promise<void> {
  await localStore.setSetting("googleIdentity", {
    email: null,
    signedIn: false,
    signedInAt: null,
  });
}
