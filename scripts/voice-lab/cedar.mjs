#!/usr/bin/env node
/**
 * OpenAI Cedar (and optional Marin) adapter.
 * Calls the network only when VOICE_LAB_EXECUTE=1 and OPENAI_API_KEY is set
 * and the conservative estimate is under the hard ceiling.
 * Never logs the key.
 */
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CEDAR_MODEL,
  CEDAR_VOICE,
  DEFAULT_COST_CEILING_USD,
  DEFAULT_INSTRUCTIONS,
  MARIN_VOICE,
  assertCostCeiling,
  assertNoSecretLeak,
  chunkForSpeechApi,
  estimateCedarUsd,
} from "./core.mjs";

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function synthesizeCedar({
  text,
  outDir,
  voice = CEDAR_VOICE,
  fetchImpl = globalThis.fetch,
  env = process.env,
  ceilingUsd = Number(env.VOICE_LAB_COST_CEILING_USD ?? DEFAULT_COST_CEILING_USD),
  execute = env.VOICE_LAB_EXECUTE === "1",
  words,
  resume = false,
  chunkName = "cedar",
}) {
  const key = env.OPENAI_API_KEY;
  const chunks = chunkForSpeechApi(text);
  const estimate = estimateCedarUsd(words ?? text.trim().split(/\s+/).length, voice === MARIN_VOICE);
  if (execute) assertCostCeiling(estimate.conservative_usd_this_run, ceilingUsd);
  const receipt = {
    provider: "openai",
    model: CEDAR_MODEL,
    voice,
    instructions: DEFAULT_INSTRUCTIONS,
    chunk_count: chunks.length,
    chunk_char_lengths: chunks.map((c) => c.length),
    estimate,
    cost_ceiling_usd: ceilingUsd,
    executed: false,
    request_count: 0,
    skipped_chunks: 0,
    files: [],
    api_key: key ? "set" : "missing",
  };

  if (!execute) {
    receipt.skip = "dry-run (set VOICE_LAB_EXECUTE=1 to call OpenAI)";
    return receipt;
  }
  if (!key) {
    throw new Error("OPENAI_API_KEY missing; fail closed");
  }

  mkdirSync(outDir, { recursive: true });
  process.stdout.write(`Cedar: ${chunks.length} chunk(s), voice=${voice}, ceiling=$${ceilingUsd}\n`);
  for (let i = 0; i < chunks.length; i += 1) {
    const chunkFile =
      chunkName === "cedar"
        ? `${voice}-chunk-${String(i + 1).padStart(2, "0")}.wav`
        : `chunk-${String(i + 1).padStart(3, "0")}.wav`;
    const file = join(outDir, chunkFile);
    if (resume && existsSync(file) && statSync(file).size > 2048) {
      process.stdout.write(`Cedar: chunk ${i + 1}/${chunks.length} skipped (exists)\n`);
      receipt.skipped_chunks += 1;
      receipt.files.push(file);
      continue;
    }
    process.stdout.write(`Cedar: chunk ${i + 1}/${chunks.length}…\n`);
    const body = {
      model: CEDAR_MODEL,
      voice,
      input: chunks[i],
      instructions: DEFAULT_INSTRUCTIONS,
      response_format: "wav",
    };
    let res;
    let errText = "";
    const maxAttempts = 4;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      res = await fetchImpl("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      receipt.request_count += 1;
      if (res.ok) break;
      errText = await res.text();
      assertNoSecretLeak(errText, key);
      if (/credit_balance_exhausted|insufficient_quota/i.test(errText)) {
        const detail = errText.trim().slice(0, 800) || "(empty body)";
        throw new Error(`OpenAI speech HTTP ${res.status}: ${detail}`);
      }
      if (res.status === 429 && attempt < maxAttempts) {
        const retryAfter = Number(res.headers.get("retry-after"));
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 15000 * attempt;
        process.stdout.write(`Cedar: HTTP 429, retry ${attempt}/${maxAttempts - 1} in ${Math.round(waitMs / 1000)}s…\n`);
        await sleep(waitMs);
        continue;
      }
      const detail = errText.trim().slice(0, 800) || "(empty body)";
      throw new Error(`OpenAI speech HTTP ${res.status}: ${detail}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(file, buf);
    process.stdout.write(`Cedar: wrote ${file} (${buf.length} bytes)\n`);
    receipt.files.push(file);
    assertNoSecretLeak(file, key);
    if (i < chunks.length - 1) await sleep(2000);
  }
  receipt.executed = true;
  writeFileSync(join(outDir, `${voice}-receipt.json`), `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
  const { readFileSync } = await import("node:fs");
  const text = readFileSync(join(ROOT, "publication/audio/voice-lab/EXCERPT.md"), "utf8");
  const words = text.trim().split(/\s+/).length;
  const receipt = await synthesizeCedar({
    text,
    words,
    outDir: join(ROOT, "local/voice-lab/cedar"),
  });
  writeFileSync(
    join(ROOT, "publication/audio/voice-lab/cedar-dry-run.json"),
    `${JSON.stringify({ ...receipt, files: receipt.files }, null, 2)}\n`,
  );
  process.stdout.write(`Cedar ${receipt.executed ? "generated" : receipt.skip}\n`);
}
