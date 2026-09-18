import type { CurriculumPacket } from "./model.ts";

/**
 * Canonical Days 1–60 arrive only as a Primary-transported local packet.
 * CloudDev must not invent or rewrite that packet. This export stays null
 * until the exact locked file is present in-repo.
 */
export const CANONICAL_PACKET: CurriculumPacket | null = null;

export const EXPECTED_PACKET_REVISION =
  "ANLCKQk1sCjAcWQUDnd6ERHm2I9LDaK3RYhzPS4K_Zqk6WunObJ94DOxIwPF50TAuakdTGi39KFiFr7FK-MeRFw5D5vXdxcwyrsDKsg-9dQ";
