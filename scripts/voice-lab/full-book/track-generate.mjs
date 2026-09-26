import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chunkForSpeechApi, estimateCedarUsd } from "../core.mjs";
import { synthesizeCedar } from "../cedar.mjs";
import { createSilenceWav } from "./silence.mjs";

export async function generateTrackRaw({
  textInfo,
  rawDir,
  env,
  ceilingUsd,
  force = false,
}) {
  if (force && rawDir) {
    rmSync(rawDir, { recursive: true, force: true });
  }
  mkdirSync(rawDir, { recursive: true });

  const assemblyOrder = [];
  let pauseIndex = 0;
  let speechIndex = 0;
  let requestCount = 0;
  const cedarParts = [];

  for (const segment of textInfo.segments) {
    if (segment.type === "pause") {
      const name = `_pause-${String(pauseIndex).padStart(3, "0")}.wav`;
      createSilenceWav(join(rawDir, name), segment.ms);
      assemblyOrder.push(name);
      pauseIndex += 1;
      continue;
    }
    const segLabel = `seg-${String(speechIndex).padStart(2, "0")}`;
    const segDir = join(rawDir, segLabel);
    speechIndex += 1;
    const receipt = await synthesizeCedar({
      text: segment.text,
      words: segment.text.trim().split(/\s+/).length,
      outDir: segDir,
      env: { ...env, VOICE_LAB_EXECUTE: "1" },
      ceilingUsd,
      execute: true,
      resume: !force,
      chunkName: "numbered",
    });
    requestCount += receipt.request_count;
    cedarParts.push(receipt);
    const chunks = readdirSync(segDir)
      .filter((f) => /^chunk-\d+\.wav$/i.test(f))
      .sort();
    for (const chunk of chunks) {
      assemblyOrder.push(`${segLabel}/${chunk}`);
    }
  }

  writeFileSync(join(rawDir, "assembly-order.json"), `${JSON.stringify(assemblyOrder, null, 2)}\n`);
  return {
    request_count: requestCount,
    cedar_parts: cedarParts,
    assembly_order: assemblyOrder,
    chunk_count: assemblyOrder.filter((f) => f.includes("chunk-")).length,
    pause_count: assemblyOrder.filter((f) => f.startsWith("_pause-")).length,
    speech_segments: speechIndex,
  };
}

export function planTrackChunks(textInfo) {
  let chunks = 0;
  for (const segment of textInfo.segments) {
    if (segment.type === "speech") chunks += chunkForSpeechApi(segment.text).length;
  }
  return chunks;
}
