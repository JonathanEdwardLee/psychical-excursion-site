export const APP_VERSION = "0.6.0";
export const SCHEMA_VERSION = 3;
export const DB_NAME = "pex-local";
export const DB_VERSION = 3;
export const DAY_COUNT = 60;

export const STORES = {
  entries: "entries",
  media: "media",
  progress: "progress",
  settings: "settings",
} as const;

export const ENTRY_TYPES = ["dream", "experience", "sensation"] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];

export const ENTRY_TYPE_LABEL: Record<EntryType, string> = {
  dream: "Dream",
  experience: "Experience",
  sensation: "Sensation",
};

export const SYNC_STATES = ["LOCAL", "PENDING_SYNC", "SYNCED", "SYNC_ERROR"] as const;
export type SyncState = (typeof SYNC_STATES)[number];

export type JournalEntry = {
  id: string;
  type: EntryType;
  createdAt: number;
  updatedAt: number;
  note: string;
  audioId: string | null;
  audioMimeType: string | null;
  audioByteLength: number | null;
  syncState: SyncState;
  localSafeAt: number | null;
  syncVersion: number;
  remoteVersion: number | null;
  remoteFileId: string | null;
  remoteMediaFileId: string | null;
  syncErrorCode: string | null;
  pexDay: number | null;
  phaseId: string | null;
};

export function normalizeJournalEntry(row: Partial<JournalEntry> & Pick<JournalEntry, "id" | "type" | "createdAt">): JournalEntry {
  const updatedAt = typeof row.updatedAt === "number" ? row.updatedAt : row.createdAt;
  return {
    id: row.id,
    type: row.type,
    createdAt: row.createdAt,
    updatedAt,
    note: typeof row.note === "string" ? row.note : "",
    audioId: row.audioId ?? null,
    audioMimeType: row.audioMimeType ?? null,
    audioByteLength: row.audioByteLength ?? null,
    syncState: row.syncState ?? "LOCAL",
    localSafeAt: row.localSafeAt ?? updatedAt,
    syncVersion: typeof row.syncVersion === "number" ? row.syncVersion : 1,
    remoteVersion: row.remoteVersion ?? null,
    remoteFileId: row.remoteFileId ?? null,
    remoteMediaFileId: row.remoteMediaFileId ?? null,
    syncErrorCode: row.syncErrorCode ?? null,
    pexDay: row.pexDay ?? null,
    phaseId: row.phaseId ?? null,
  };
}

export type MediaRecord = {
  id: string;
  entryId: string;
  mimeType: string;
  blob: Blob;
  byteLength: number;
  createdAt: number;
};

export type DayProgress = {
  day: number;
  unlocked: true;
  visitedAt: number | null;
  completedAt: number | null;
};

export type PersistenceReport = {
  inspectedAt: number;
  storageApiPresent: boolean;
  persistApiPresent: boolean;
  persistedBeforeRequest: boolean | null;
  persistRequestAttempted: boolean;
  persistGranted: boolean | null;
  estimateUsageBytes: number | null;
  estimateQuotaBytes: number | null;
  notes: string[];
};

export type AppErrorCode =
  | "indexeddb-unavailable"
  | "indexeddb-open-failed"
  | "save-failed"
  | "quota-exceeded"
  | "delete-failed"
  | "export-failed"
  | "media-unavailable"
  | "permission-denied"
  | "recorder-unsupported"
  | "recorder-failed"
  | "mime-unsupported"
  | "recording-interrupted"
  | "empty-capture";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly recoverable: boolean;

  constructor(code: AppErrorCode, message: string, recoverable = true) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.recoverable = recoverable;
  }
}

export function isEntryType(value: string): value is EntryType {
  return (ENTRY_TYPES as readonly string[]).includes(value);
}

export function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyDayProgress(day: number): DayProgress {
  return { day, unlocked: true, visitedAt: null, completedAt: null };
}

export function normalizeDayProgress(row: Partial<DayProgress> & { day: number }): DayProgress {
  return {
    day: row.day,
    unlocked: true,
    visitedAt: typeof row.visitedAt === "number" ? row.visitedAt : null,
    completedAt: typeof row.completedAt === "number" ? row.completedAt : null,
  };
}
