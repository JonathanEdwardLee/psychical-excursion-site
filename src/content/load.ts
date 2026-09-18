import { CANONICAL_PACKET } from "./canonical.ts";
import { isCanonicalPacket, type CurriculumPacket } from "./model.ts";

let cached: CurriculumPacket | null = null;

export function loadCurriculumPacket(): CurriculumPacket {
  if (cached) return cached;
  if (!isCanonicalPacket(CANONICAL_PACKET)) {
    throw new Error("Canonical Days 1–60 packet is missing or invalid.");
  }
  cached = CANONICAL_PACKET;
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
    readyForAcceptance: isCanonicalPacket(packet),
  };
}
