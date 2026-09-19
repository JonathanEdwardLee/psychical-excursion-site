import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { localStore } from "../db/store.ts";
import { DB_NAME } from "../domain/types.ts";
import { setGoogleApiFetchForTests } from "./googleApiClient.ts";
import { reconcileJournalFromDrive } from "./reconcile.ts";
import { uploadJournalEntryToDrive } from "./driveUpload.ts";

vi.mock("./googleAuth.ts", () => ({
  requireDriveAccessToken: vi.fn(async () => "test-token"),
  markDriveAuthExpired: vi.fn(async () => {}),
}));

async function resetDb(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("reset failed"));
    request.onblocked = () => resolve();
  });
}

describe("reconcileJournalFromDrive", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(() => {
    setGoogleApiFetchForTests(null);
  });

  it("imports an older-year entry and preserves remote media file id for idempotent sync", async () => {
    const metadata = {
      schema_version: 3,
      entry_id: "entry-import-2026",
      captured_at: "2026-03-01T08:00:00.000Z",
      capture_type: "dream",
      pex_day: 1,
      phase: "remember",
      note: "imported-note",
      media_mime: "audio/webm",
      sync_state: "SYNCED",
      sync_version: 2,
      remote_version: 2,
    };
    const uploadUrls: string[] = [];
    let counter = 0;

    setGoogleApiFetchForTests(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      if (url.includes("/files?q=")) {
        if (url.includes("Psychical%20Excursion") && !url.includes("Journal")) {
          return new Response(
            JSON.stringify({
              files: [{ id: "pex-root", name: "Psychical Excursion", mimeType: "application/vnd.google-apps.folder" }],
            }),
            { status: 200 },
          );
        }
        if (url.includes("name%3D'Journal'") || (url.includes("Journal") && url.includes("pex-root"))) {
          return new Response(
            JSON.stringify({
              files: [{ id: "journal-root", name: "Journal", mimeType: "application/vnd.google-apps.folder" }],
            }),
            { status: 200 },
          );
        }
        if (url.includes("journal-root")) {
          return new Response(
            JSON.stringify({
              files: [{ id: "folder-2026", name: "2026", mimeType: "application/vnd.google-apps.folder" }],
            }),
            { status: 200 },
          );
        }
        if (url.includes("folder-2026")) {
          return new Response(
            JSON.stringify({
              files: [
                {
                  id: "meta-2026",
                  name: "meta.json",
                  appProperties: { pex_kind: "metadata", pex_entry_id: "entry-import-2026" },
                },
                {
                  id: "media-remote-2026",
                  name: "audio.webm",
                  appProperties: { pex_kind: "media", pex_entry_id: "entry-import-2026" },
                },
              ],
            }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({ files: [] }), { status: 200 });
      }
      if (url.includes("/files/meta-2026?alt=media")) {
        return new Response(JSON.stringify(metadata), { status: 200 });
      }
      if (url.includes("/files/media-remote-2026?alt=media")) {
        return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
      }
      if (url.includes("uploadType=multipart")) {
        uploadUrls.push(url);
        return new Response(JSON.stringify({ id: url.includes("media-remote") ? "media-remote-2026" : "meta-2026" }), {
          status: 200,
        });
      }
      if (url.includes("/drive/v3/files") && method === "POST") {
        counter += 1;
        return new Response(JSON.stringify({ id: `folder-${counter}` }), { status: 200 });
      }
      return new Response(JSON.stringify({ files: [] }), { status: 200 });
    });

    const summary = await reconcileJournalFromDrive();
    expect(summary.imported).toBe(1);

    const imported = await localStore.getEntry("entry-import-2026");
    expect(imported?.entry.remoteMediaFileId).toBe("media-remote-2026");
    expect(imported?.entry.createdAt).toBe(Date.parse("2026-03-01T08:00:00.000Z"));

    await localStore.updateNote("entry-import-2026", "edited-after-import");
    const edited = (await localStore.getEntry("entry-import-2026"))!.entry;
    const upload = await uploadJournalEntryToDrive(edited, imported!.media);
    expect(upload.ok).toBe(true);
    expect(uploadUrls.some((u) => u.includes("/files/media-remote-2026"))).toBe(true);
    expect(uploadUrls.some((u) => u.includes("/files/meta-2026"))).toBe(true);
  });
});
