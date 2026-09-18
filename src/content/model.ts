import { DAY_COUNT } from "../domain/types.ts";
import { OPTIONAL_TIMING_DAY, PHASES, phaseForDay, type PhaseId } from "./phases.ts";

export type PacketSource = "canonical-packet" | "development-fixture";

export type DaySection = {
  heading: string;
  paragraphs: string[];
};

export type DayDocument = {
  day: number;
  phaseId: PhaseId;
  title: string;
  optional: boolean;
  optionalNote: string | null;
  sections: DaySection[];
  source: PacketSource;
};

export type CurriculumPacket = {
  revision: string | null;
  source: PacketSource;
  days: DayDocument[];
};

export type PacketIssue = {
  code: string;
  detail: string;
};

export function validatePacket(packet: CurriculumPacket): PacketIssue[] {
  const issues: PacketIssue[] = [];
  if (packet.days.length !== DAY_COUNT) {
    issues.push({ code: "count", detail: `Expected ${DAY_COUNT} days, received ${packet.days.length}.` });
  }
  const seen = new Set<number>();
  for (const document of packet.days) {
    if (!Number.isInteger(document.day) || document.day < 1 || document.day > DAY_COUNT) {
      issues.push({ code: "range", detail: `Day ${document.day} is outside 1–${DAY_COUNT}.` });
      continue;
    }
    if (seen.has(document.day)) {
      issues.push({ code: "duplicate", detail: `Day ${document.day} appears more than once.` });
    }
    seen.add(document.day);
    const phase = phaseForDay(document.day);
    if (!phase) {
      issues.push({ code: "phase-missing", detail: `Day ${document.day} has no phase range.` });
    } else if (document.phaseId !== phase.id) {
      issues.push({
        code: "phase-mismatch",
        detail: `Day ${document.day} is assigned ${document.phaseId} but belongs in ${phase.name}.`,
      });
    }
    if (document.day === OPTIONAL_TIMING_DAY && !document.optional) {
      issues.push({ code: "optional-51", detail: "Day 51 must remain clearly optional." });
    }
    if (document.day !== OPTIONAL_TIMING_DAY && document.optional) {
      issues.push({ code: "optional-other", detail: `Day ${document.day} must not be marked optional.` });
    }
    if (!Array.isArray(document.sections) || document.sections.length === 0) {
      issues.push({ code: "sections", detail: `Day ${document.day} is missing ordered sections.` });
    }
  }
  for (let day = 1; day <= DAY_COUNT; day += 1) {
    if (!seen.has(day)) issues.push({ code: "missing", detail: `Day ${day} is missing.` });
  }
  for (const phase of PHASES) {
    const count = packet.days.filter((document) => document.phaseId === phase.id).length;
    const expected = phase.end - phase.start + 1;
    if (count !== expected) {
      issues.push({
        code: "phase-count",
        detail: `${phase.name} should contain ${expected} days, found ${count}.`,
      });
    }
  }
  return issues;
}

export function packetByDay(packet: CurriculumPacket): Map<number, DayDocument> {
  return new Map(packet.days.map((document) => [document.day, document]));
}

export function isCanonicalPacket(packet: CurriculumPacket): boolean {
  return packet.source === "canonical-packet" && packet.revision !== null && validatePacket(packet).length === 0;
}
