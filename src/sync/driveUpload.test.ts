import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeJournalEntry } from "../domain/types.ts";
import { setGoogleApiFetchForTests } from "./googleApiClient.ts";
import { uploadJournalEntryToDrive } from "./driveUpload.ts";

vi.mock("./googleAuth.ts", () => ({
  requireDriveAccessToken: vi.fn(async () => "test-token"),
  markDriveAuthExpired: vi.fn(async () => {}),
}));

describe("drive upload", () => {
  beforeEach(() => {
    let counter = 0;
    setGoogleApiFetchForTests(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      if (url.includes("?alt=media")) {
        return new Response(new ArrayBuffer(0), { status: 200 });
      }
      if (url.includes("uploadType=multipart")) {
        counter += 1;
        const id = url.includes("/files/file-1") ? "file-1" : `file-${counter}`;
        return new Response(JSON.stringify({ id, name: "meta.json" }), { status: 200 });
      }
      if (url.includes("/files?q=")) {
        return new Response(JSON.stringify({ files: [] }), { status: 200 });
      }
      if (url.includes("/drive/v3/files") && method === "POST") {
        counter += 1;
        return new Response(JSON.stringify({ id: `folder-${counter}`, name: "folder" }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });
  });

  afterEach(() => {
    setGoogleApiFetchForTests(null);
  });

  it("uploads metadata idempotently using existing remote file id", async () => {
    const entry = normalizeJournalEntry({
      id: "entry-upload-1",
      type: "dream",
      createdAt: Date.UTC(2026, 0, 15),
      note: "note",
      remoteFileId: "file-1",
    });
    const first = await uploadJournalEntryToDrive(entry, null);
    expect(first.ok).toBe(true);
    if (first.ok) expect(first.remoteFileId).toBeTruthy();
    const second = await uploadJournalEntryToDrive(entry, null);
    expect(second.ok).toBe(true);
  });
});
