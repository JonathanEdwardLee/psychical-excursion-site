import type { JournalEntry } from "../domain/types.ts";
import { ENTRY_TYPE_LABEL } from "../domain/types.ts";
import { extensionForMime } from "../export/zip.ts";

export function driveJournalRoot(): string {
  return "Psychical Excursion/Journal";
}

export function driveEntryFolderPath(entry: JournalEntry): string {
  const year = new Date(entry.createdAt).getUTCFullYear();
  return `${driveJournalRoot()}/${year}`;
}

export function driveMediaFileName(entry: JournalEntry, mimeType: string): string {
  const stamp = new Date(entry.createdAt).toISOString().replace(/[:.]/g, "-");
  const label = ENTRY_TYPE_LABEL[entry.type];
  const ext = extensionForMime(mimeType);
  return `${stamp} — ${label}.${ext}`;
}

export function driveMetadataFileName(entry: JournalEntry): string {
  const stamp = new Date(entry.createdAt).toISOString().replace(/[:.]/g, "-");
  return `${stamp} — ${ENTRY_TYPE_LABEL[entry.type]}.json`;
}
