import { APP_VERSION, SCHEMA_VERSION, type JournalEntry, type MediaRecord } from "../domain/types.ts";
import { createZip, extensionForMime } from "./zip.ts";

export const EXPORT_FORMAT = "pex-journal-export";
export const EXPORT_FORMAT_VERSION = 1;

export type ExportManifest = {
  format: typeof EXPORT_FORMAT;
  formatVersion: typeof EXPORT_FORMAT_VERSION;
  appVersion: string;
  schemaVersion: number;
  exportedAt: string;
  entryCount: number;
  recordingCount: number;
  files: string[];
};

export type ExportJournalFile = {
  entries: Array<{
    id: string;
    type: JournalEntry["type"];
    createdAt: string;
    updatedAt: string;
    note: string;
    recording: { file: string; mimeType: string; byteLength: number } | null;
  }>;
};

async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === "function") {
    return new Uint8Array(await blob.arrayBuffer());
  }
  if (typeof Response === "function") {
    try {
      return new Uint8Array(await new Response(blob).arrayBuffer());
    } catch {
      // fall through
    }
  }
  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error("blob-read-failed"));
    reader.readAsArrayBuffer(blob);
  });
  return new Uint8Array(buffer);
}

export async function buildJournalZip(
  entries: JournalEntry[],
  media: MediaRecord[],
  exportedAt = new Date(),
): Promise<{ filename: string; bytes: Uint8Array; manifest: ExportManifest }> {
  const mediaById = new Map(media.map((item) => [item.id, item]));
  const files: { path: string; data: Uint8Array }[] = [];
  const journal: ExportJournalFile = { entries: [] };
  const listedFiles = ["manifest.json", "journal.json"];

  for (const entry of entries) {
    let recording: ExportJournalFile["entries"][number]["recording"] = null;
    if (entry.audioId) {
      const rec = mediaById.get(entry.audioId);
      if (rec) {
        const ext = extensionForMime(rec.mimeType);
        const path = `recordings/${entry.id}.${ext}`;
        const data = await blobToBytes(rec.blob);
        files.push({ path, data });
        listedFiles.push(path);
        recording = { file: path, mimeType: rec.mimeType, byteLength: rec.byteLength };
      }
    }
    journal.entries.push({
      id: entry.id,
      type: entry.type,
      createdAt: new Date(entry.createdAt).toISOString(),
      updatedAt: new Date(entry.updatedAt).toISOString(),
      note: entry.note,
      recording,
    });
  }

  const manifest: ExportManifest = {
    format: EXPORT_FORMAT,
    formatVersion: EXPORT_FORMAT_VERSION,
    appVersion: APP_VERSION,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: exportedAt.toISOString(),
    entryCount: entries.length,
    recordingCount: files.length,
    files: listedFiles,
  };

  const encoder = new TextEncoder();
  const zipFiles = [
    { path: "manifest.json", data: encoder.encode(`${JSON.stringify(manifest, null, 2)}\n`) },
    { path: "journal.json", data: encoder.encode(`${JSON.stringify(journal, null, 2)}\n`) },
    ...files,
  ];

  const stamp = exportedAt.toISOString().replace(/[:.]/g, "-");
  return {
    filename: `pex-journal-${stamp}.zip`,
    bytes: createZip(zipFiles),
    manifest,
  };
}
