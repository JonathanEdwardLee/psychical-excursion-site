import { describe, expect, it } from "vitest";
import { normalizeJournalEntry } from "./types.ts";

describe("normalizeJournalEntry", () => {
  it("migrates legacy rows to schema v2 defaults", () => {
    const row = normalizeJournalEntry({
      id: "entry-legacy",
      type: "sensation",
      createdAt: 1_700_000_000_000,
      note: "legacy-note",
      audioId: null,
    });
    expect(row.syncState).toBe("LOCAL");
    expect(row.localSafeAt).toBe(1_700_000_000_000);
    expect(row.syncVersion).toBe(1);
  });
});
