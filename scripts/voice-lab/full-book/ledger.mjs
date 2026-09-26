import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FULL_BOOK_COST_CEILING_USD } from "../core.mjs";

export function ledgerPath(bookRoot) {
  return join(bookRoot, "PRODUCTION-LEDGER.json");
}

export function readLedger(bookRoot) {
  const path = ledgerPath(bookRoot);
  if (!existsSync(path)) {
    return {
      cost_ceiling_usd: FULL_BOOK_COST_CEILING_USD,
      conservative_usd_estimated: 0,
      api_request_count: 0,
      tracks: {},
    };
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeLedger(bookRoot, ledger) {
  mkdirSync(bookRoot, { recursive: true });
  writeFileSync(ledgerPath(bookRoot), `${JSON.stringify(ledger, null, 2)}\n`);
}

export function assertLedgerHeadroom(ledger, additionalUsdEstimate, ceilingUsd) {
  const next = ledger.conservative_usd_estimated + additionalUsdEstimate;
  if (next > ceilingUsd) {
    throw new Error(
      `Audiobook would exceed $${ceilingUsd} conservative ceiling (ledger $${ledger.conservative_usd_estimated} + track $${additionalUsdEstimate}). Fail closed.`,
    );
  }
}
