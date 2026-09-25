#!/usr/bin/env node
/**
 * OpenAI Cedar (and optional Marin) adapter.
 * Calls the network only when VOICE_LAB_EXECUTE=1 and OPENAI_API_KEY is set
 * and the conservative estimate is under the hard ceiling.
 * Never logs the key.
 */
import { mkdirSync, writeFileSync } from "node:fs";
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

export async function synthesizeCedar({
  text,
  outDir,
  voice = CEDAR_VOICE,
  fetchImpl = globalThis.fetch,
  env = process.env,
  ceilingUsd = Number(env.VOICE_LAB_COST_CEILING_USD ?? DEFAULT_COST_CEILING_USD),
  execute = env.VOICE_LAB_EXECUTE === "1",
  words,
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
  for (let i = 0; i < chunks.length; i += 1) {
    const body = {
      model: CEDAR_MODEL,
      voice,
      input: chunks[i],
      instructions: DEFAULT_INSTRUCTIONS,
      response_format: "wav",
    };
    const res = await fetchImpl("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    receipt.request_count += 1;
    if (!res.ok) {
      const errText = await res.text();
      assertNoSecretLeak(errText, key);
      throw new Error(`OpenAI speech HTTP ${res.status}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const file = join(outDir, `${voice}-chunk-${String(i + 1).padStart(2, "0")}.wav`);
    writeFileSync(file, buf);
    receipt.files.push(file);
    assertNoSecretLeak(file, key);
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
