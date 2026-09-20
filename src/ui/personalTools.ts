import { localStore } from "../db/store.ts";
import type { DayProgress } from "../domain/types.ts";
import { loadGoogleIdentityState } from "../sync/googleAuth.ts";

/** Saved progress and Dream Journal are signed-in personal tools; guide reading stays public. */
export async function personalToolsUnlocked(): Promise<boolean> {
  const identity = await loadGoogleIdentityState();
  return identity.signedIn;
}

/** Participant-visible progress (empty when signed out — legacy rows remain in storage). */
export async function progressForParticipantUI(): Promise<DayProgress[]> {
  if (!(await personalToolsUnlocked())) return [];
  return localStore.listProgress();
}

export async function resumeDaySettingForParticipantUI(): Promise<number | undefined> {
  if (!(await personalToolsUnlocked())) return undefined;
  return localStore.loadResumeDay();
}
