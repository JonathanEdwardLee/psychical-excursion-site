#!/usr/bin/env node
import { cpus, freemem, totalmem, type, release } from "node:os";
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync, statfsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

function diskFreeGb() {
  try {
    const s = statfsSync("/");
    return Math.round(((s.bavail * s.bsize) / 1024 / 1024 / 1024) * 10) / 10;
  } catch {
    return null;
  }
}

function gpu() {
  try {
    const text = execSync("nvidia-smi --query-gpu=name,memory.total --format=csv,noheader", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return { nvidia: true, report: text };
  } catch {
    return { nvidia: false, report: "no nvidia-smi" };
  }
}

export function inspectHardware() {
  const gpuInfo = gpu();
  const ramGb = Math.round((totalmem() / 1024 / 1024 / 1024) * 10) / 10;
  const freeGb = Math.round((freemem() / 1024 / 1024 / 1024) * 10) / 10;
  const cpuCount = cpus().length;
  const hasGpu = gpuInfo.nvidia;
  let decision;
  if (hasGpu) {
    decision = {
      chatterbox_variant: "gpu-turbo-or-english-500m",
      install: "allowed-if-operator-confirms-disk",
      reason: "NVIDIA GPU present",
    };
  } else if (freeGb < 8 || ramGb < 12 || cpuCount < 4) {
    decision = {
      chatterbox_variant: "none",
      install: "refused",
      reason:
        "No GPU; available RAM/CPU is too tight to download Torch + Chatterbox weights in this environment without risking instability. Operator laptop with ≥8 CPU cores may try Chatterbox-Nano later; do not buy hardware.",
    };
  } else {
    decision = {
      chatterbox_variant: "chatterbox-nano",
      install: "operator-opt-in-only",
      reason: "CPU-only. Prefer Nano. Do not auto-download in CI/cloud agents.",
    };
  }
  return {
    inspected_at: new Date().toISOString(),
    os: `${type()} ${release()}`,
    cpu_count: cpuCount,
    cpu_model: cpus()[0]?.model ?? "unknown",
    ram_gb: ramGb,
    ram_free_gb: freeGb,
    disk_free_gb: diskFreeGb(),
    python: process.env.PYTHON ?? "python3",
    gpu: gpuInfo,
    gate: decision,
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const report = inspectHardware();
  const outDir = join(ROOT, "publication/audio/voice-lab");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "HARDWARE-RECEIPT.json"), `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${report.gate.install}: ${report.gate.reason}\n`);
}
