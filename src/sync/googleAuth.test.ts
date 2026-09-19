import { describe, expect, it } from "vitest";
import { compareEntryVersions } from "../domain/sync.ts";
import { normalizeJournalEntry } from "../domain/types.ts";

describe("cross-device conflict rules", () => {
  it("never prefers remote when local sync version is newer", () => {
    const local = normalizeJournalEntry({
      id: "entry-conflict",
      type: "dream",
      createdAt: 1,
      syncVersion: 4,
      remoteVersion: 2,
    });
    expect(compareEntryVersions(local, 5)).toBe("manual_required");
    expect(compareEntryVersions(local, 2)).toBe("keep_local");
  });
});
