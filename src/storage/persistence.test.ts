import { describe, expect, it, vi } from "vitest";
import { inspectAndRequestPersistence, persistenceSummary } from "./persistence.ts";

describe("persistence reporting", () => {
  it("never claims a grant when persist returns false", async () => {
    const persist = vi.fn().mockResolvedValue(false);
    const report = await inspectAndRequestPersistence({
      persist,
      persisted: vi.fn().mockResolvedValue(false),
      estimate: vi.fn().mockResolvedValue({ usage: 10, quota: 1000 }),
    } as unknown as StorageManager);
    expect(report.persistRequestAttempted).toBe(true);
    expect(report.persistGranted).toBe(false);
    expect(persistenceSummary(report).granted).toBe(false);
    expect(persistenceSummary(report).headline).toMatch(/not enabled/i);
  });

  it("handles missing storage APIs", async () => {
    const report = await inspectAndRequestPersistence(undefined);
    expect(report.storageApiPresent).toBe(false);
    expect(report.persistGranted).toBeNull();
    expect(persistenceSummary(report).granted).toBe(false);
  });

  it("records an actual true grant", async () => {
    const report = await inspectAndRequestPersistence({
      persist: vi.fn().mockResolvedValue(true),
      persisted: vi.fn().mockResolvedValue(false),
      estimate: vi.fn().mockResolvedValue({ usage: 1, quota: 2 }),
    } as unknown as StorageManager);
    expect(report.persistGranted).toBe(true);
    expect(persistenceSummary(report).granted).toBe(true);
  });
});
