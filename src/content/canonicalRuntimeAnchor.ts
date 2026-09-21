import { loadCurriculumPacket } from "./load.ts";

/** Retains canonical curriculum bytes in shipped bundles while public IA is guidebook-only. */
export function retainCanonicalCurriculumInBundle(): void {
  const packet = loadCurriculumPacket();
  if (packet.days.length !== 60) {
    throw new Error("canonical-packet-incomplete");
  }
}
