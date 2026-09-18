import { describe, expect, it } from "vitest";
import { CANONICAL_PACKET, EXPECTED_PACKET_REVISION } from "./canonical.ts";
import { loadCurriculumPacket, packetStatus, resetCurriculumCache } from "./load.ts";
import { isCanonicalPacket, validatePacket, type CurriculumPacket } from "./model.ts";
import { OPTIONAL_TIMING_DAY, PHASES, phaseForDay } from "./phases.ts";

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

  it("loads the Primary-transported canonical packet 60/60", () => {
    resetCurriculumCache();
    const packet = loadCurriculumPacket();
    expect(packet.source).toBe("canonical-packet");
    expect(packet.revision).toBe(EXPECTED_PACKET_REVISION);
    expect(isCanonicalPacket(packet)).toBe(true);
    expect(packetStatus(packet).readyForAcceptance).toBe(true);
    expect(validatePacket(packet)).toEqual([]);
    expect(packet.days).toHaveLength(60);
    expect(new Set(packet.days.map((day) => day.day)).size).toBe(60);
    expect(JSON.stringify(packet).includes("DEVELOPMENT FIXTURE")).toBe(false);
    expect(packet.days.find((day) => day.day === OPTIONAL_TIMING_DAY)?.optional).toBe(true);
    expect(packet.days.filter((day) => day.optional)).toHaveLength(1);
    for (const document of packet.days) {
      expect(document.phaseId).toBe(phaseForDay(document.day)?.id);
      expect(document.source).toBe("canonical-packet");
      expect(document.sections.length).toBeGreaterThan(0);
      expect(document.sections[0]?.heading).toBeTruthy();
    }
    const day1 = packet.days.find((day) => day.day === 1)!;
    expect(day1.title).toBe("CATCH THE DREAM");
    expect(day1.sections.map((section) => section.heading)).toEqual([
      "TODAY",
      "PRACTICE",
      "AFFIRMATION",
      "RESEARCH NOTE",
    ]);
    expect(day1.sections[0]?.paragraphs[0]).toBe(
      "Start with recall. Do not try to change your dreams yet. Catch what is already there.",
    );
    const day21 = packet.days.find((day) => day.day === 21)!;
    expect(JSON.stringify(day21)).not.toMatch(/https:\/https:\/\//);
    expect(JSON.stringify(day21)).toMatch("https://pmc.ncbi.nlm.nih.gov/articles/PMC10078162/");
    const day60 = packet.days.find((day) => day.day === 60)!;
    expect(day60.title).toBe("INDEPENDENT ATTEMPT");
    expect(day60.phaseId).toBe("learn-your-door");
  });

  it("rejects a short packet", () => {
    const packet: CurriculumPacket = {
      ...CANONICAL_PACKET,
      days: CANONICAL_PACKET.days.slice(0, 59),
    };
    expect(validatePacket(packet).some((issue) => issue.code === "count" || issue.code === "missing")).toBe(true);
  });
});
