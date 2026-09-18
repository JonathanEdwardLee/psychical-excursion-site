import { describe, expect, it } from "vitest";
import { developmentFixturePacket } from "./fixtures.ts";
import { resetCurriculumCache, loadCurriculumPacket, packetStatus } from "./load.ts";
import { isCanonicalPacket, validatePacket } from "./model.ts";
import { OPTIONAL_TIMING_DAY, PHASES, phaseForDay } from "./phases.ts";
import { CANONICAL_PACKET } from "./canonical.ts";

describe("curriculum packet", () => {
  it("has eight locked phase ranges", () => {
    expect(PHASES).toHaveLength(8);
    expect(PHASES.map((phase) => [phase.name, phase.start, phase.end])).toEqual([
      ["REMEMBER", 1, 4],
      ["FEEL", 5, 14],
      ["HOLD", 15, 21],
      ["RECOGNIZE", 22, 30],
      ["OBSERVE", 31, 38],
      ["MOVE", 39, 46],
      ["ATTEMPT", 47, 54],
      ["LEARN YOUR DOOR", 55, 60],
    ]);
  });

  it("covers sixty unique days without overlap", () => {
    const covered = PHASES.flatMap((phase) => {
      const days: number[] = [];
      for (let day = phase.start; day <= phase.end; day += 1) days.push(day);
      return days;
    });
    expect(covered).toHaveLength(60);
    expect(new Set(covered).size).toBe(60);
    expect(covered[0]).toBe(1);
    expect(covered[59]).toBe(60);
  });

  it("does not load an invented canonical packet", () => {
    expect(CANONICAL_PACKET).toBeNull();
    resetCurriculumCache();
    const packet = loadCurriculumPacket();
    expect(packet.source).toBe("development-fixture");
    expect(isCanonicalPacket(packet)).toBe(false);
    expect(packetStatus(packet).readyForAcceptance).toBe(false);
    expect(validatePacket(packet)).toEqual([]);
    expect(packet.days).toHaveLength(60);
    expect(new Set(packet.days.map((day) => day.day)).size).toBe(60);
    expect(packet.days.every((day) => day.title.includes("DEVELOPMENT FIXTURE"))).toBe(true);
    expect(packet.days.every((day) => day.sections.length > 0)).toBe(true);
    expect(packet.days.find((day) => day.day === OPTIONAL_TIMING_DAY)?.optional).toBe(true);
    expect(packet.days.filter((day) => day.optional)).toHaveLength(1);
    for (const document of packet.days) {
      expect(document.phaseId).toBe(phaseForDay(document.day)?.id);
    }
  });

  it("rejects a short packet", () => {
    const packet = developmentFixturePacket();
    packet.days.pop();
    expect(validatePacket(packet).some((issue) => issue.code === "count" || issue.code === "missing")).toBe(true);
  });
});
