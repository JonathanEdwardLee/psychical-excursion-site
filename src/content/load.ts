import { CANONICAL_PACKET } from "./canonical.ts";
import { developmentFixturePacket } from "./fixtures.ts";
import { isCanonicalPacket, validatePacket, type CurriculumPacket } from "./model.ts";

let cached: CurriculumPacket | null = null;

export function loadCurriculumPacket(): CurriculumPacket {
  if (cached) return cached;
  if (CANONICAL_PACKET && isCanonicalPacket(CANONICAL_PACKET)) {
    cached = CANONICAL_PACKET;
    return cached;
  }
  const fixtures = developmentFixturePacket();
  const issues = validatePacket(fixtures);
  if (issues.length > 0) {
    throw new Error(`Fixture packet failed validation: ${issues.map((issue) => issue.detail).join(" ")}`);
  }
  cached = fixtures;
  return cached;
}

export function resetCurriculumCache(): void {
  cached = null;
}

export function packetStatus(packet = loadCurriculumPacket()): {
  source: CurriculumPacket["source"];
  revision: string | null;
  readyForAcceptance: boolean;
} {
  return {
    source: packet.source,
    revision: packet.revision,
    readyForAcceptance: packet.source === "canonical-packet" && packet.revision !== null,
  };
}
