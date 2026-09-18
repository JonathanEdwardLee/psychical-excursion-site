import type { PersistenceReport } from "../domain/types.ts";
import { localStore } from "../db/store.ts";

export async function inspectAndRequestPersistence(
  storage: StorageManager | undefined = navigator.storage,
): Promise<PersistenceReport> {
  const notes: string[] = [];
  const storageApiPresent = Boolean(storage);
  const persistApiPresent = typeof storage?.persist === "function";
  let persistedBeforeRequest: boolean | null = null;
  let persistRequestAttempted = false;
  let persistGranted: boolean | null = null;
  let estimateUsageBytes: number | null = null;
  let estimateQuotaBytes: number | null = null;

  if (!storageApiPresent) {
    notes.push("navigator.storage is not present. Persistence cannot be requested in this browser.");
  } else {
    if (typeof storage?.persisted === "function") {
      try {
        persistedBeforeRequest = await storage.persisted();
      } catch {
        notes.push("storage.persisted() threw; treated as unknown.");
      }
    } else {
      notes.push("storage.persisted() is not present.");
    }

    if (typeof storage?.estimate === "function") {
      try {
        const estimate = await storage.estimate();
        estimateUsageBytes = typeof estimate.usage === "number" ? estimate.usage : null;
        estimateQuotaBytes = typeof estimate.quota === "number" ? estimate.quota : null;
      } catch {
        notes.push("storage.estimate() threw.");
      }
    } else {
      notes.push("storage.estimate() is not present.");
    }

    if (persistApiPresent && persistedBeforeRequest !== true) {
      persistRequestAttempted = true;
      try {
        persistGranted = await storage!.persist();
        if (persistGranted !== true) {
          notes.push("persist() returned a non-true result. The UI must not claim persistence was granted.");
        }
      } catch {
        persistGranted = false;
        notes.push("persist() threw. Persistence is not claimed.");
      }
    } else if (!persistApiPresent) {
      notes.push("storage.persist() is not present.");
    } else {
      persistGranted = true;
      notes.push("Storage was already marked persisted before this request.");
    }
  }

  const report: PersistenceReport = {
    inspectedAt: Date.now(),
    storageApiPresent,
    persistApiPresent,
    persistedBeforeRequest,
    persistRequestAttempted,
    persistGranted,
    estimateUsageBytes,
    estimateQuotaBytes,
    notes,
  };

  try {
    await localStore.savePersistenceReport(report);
  } catch {
    notes.push("The persistence report could not be stored in IndexedDB.");
  }

  return report;
}

export function persistenceSummary(report: PersistenceReport | undefined): {
  granted: boolean;
  headline: string;
  detail: string;
} {
  if (!report) {
    return {
      granted: false,
      headline: "Storage persistence has not been checked yet.",
      detail: "Journal data still lives only in this browser. Export is the recovery path for this phase.",
    };
  }
  if (report.persistGranted === true) {
    return {
      granted: true,
      headline: "This browser reported persistent storage as granted.",
      detail:
        "That reduces some eviction risk. It is not a cloud backup. Data still lives on this device and can be lost.",
    };
  }
  if (!report.storageApiPresent || !report.persistApiPresent) {
    return {
      granted: false,
      headline: "This browser does not expose persistent-storage APIs.",
      detail: "Entries remain local-only. Browser or device data may be lost. Export is the recovery mechanism.",
    };
  }
  return {
    granted: false,
    headline: "Persistent storage is not enabled.",
    detail:
      "The app did not claim persistence. Data lives in this browser on this device, is not cloud backed up, and may be lost. Export is the recovery mechanism in this phase.",
  };
}
