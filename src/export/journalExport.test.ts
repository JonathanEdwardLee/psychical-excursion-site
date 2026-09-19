import { describe, expect, it } from "vitest";
import { buildJournalZip, EXPORT_FORMAT } from "./journalExport.ts";
import { normalizeJournalEntry, type JournalEntry, type MediaRecord } from "../domain/types.ts";

describe("journal export", () => {
  it("includes text-only entries and recordings", async () => {
    const entries: JournalEntry[] = [
      normalizeJournalEntry({
        id: "e1",
        type: "sensation",
        createdAt: 1,
        note: "fixture-text-only",
        audioId: null,
      }),
      normalizeJournalEntry({
        id: "e2",
        type: "experience",
        createdAt: 2,
        note: "fixture-with-audio",
        audioId: "a2",
        audioMimeType: "audio/webm",
        audioByteLength: 4,
      }),
    ];
    const media: MediaRecord[] = [
      {
        id: "a2",
        entryId: "e2",
        mimeType: "audio/webm",
        blob: new Blob([new Uint8Array([4, 5, 6, 7])], { type: "audio/webm" }),
        byteLength: 4,
        createdAt: 2,
      },
    ];
    const zip = await buildJournalZip(entries, media, new Date("2026-09-18T00:00:00.000Z"));
    expect(zip.filename).toContain("pex-journal-");
    expect(zip.manifest.format).toBe(EXPORT_FORMAT);
    expect(zip.manifest.entryCount).toBe(2);
    expect(zip.manifest.recordingCount).toBe(1);
    const decoded = new TextDecoder("latin1").decode(zip.bytes);
    expect(decoded.includes("journal.json")).toBe(true);
    expect(decoded.includes("recordings/e2.webm")).toBe(true);
    expect(decoded.includes("fixture-text-only")).toBe(true);
  });
});
