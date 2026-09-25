import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "../..");

function spokenOnly(script: string): string {
  return script
    .replace(/<!--[\s\S]*?-->/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

describe("local AI narration voice lab", () => {
  it("keeps the Chapter 10 excerpt verbatim from the session script", () => {
    const script = readFileSync(
      join(ROOT, "publication/audio/session-scripts/10-watch-the-edge.md"),
      "utf8",
    );
    const excerpt = readFileSync(join(ROOT, "publication/audio/voice-lab/EXCERPT.md"), "utf8").trim();
    expect(spokenOnly(script)).toContain(excerpt);
    expect(excerpt).toContain("Let yourself fall asleep");
    expect(excerpt).toContain("EEG");
    expect(excerpt).toMatch(/Hypnagogia/);
    expect(excerpt).toContain("Ask occasionally");
    expect(excerpt).not.toMatch(/\[\d+\]/);
    expect(excerpt).not.toContain("## References");
    expect(excerpt).not.toMatch(/https?:\/\//);
  });

  it("chunks under the speech API input limit and enforces the cost ceiling", () => {
    const result = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `
        import { chunkForSpeechApi, assertCostCeiling, MAX_SPEECH_INPUT_CHARS } from ${JSON.stringify(join(ROOT, "scripts/voice-lab/core.mjs"))};
        const chunks = chunkForSpeechApi("Hello.\\n\\n".repeat(50) + "World.", 40);
        if (chunks.some((c) => c.length > 40)) throw new Error("chunk too big");
        if (MAX_SPEECH_INPUT_CHARS > 2000) throw new Error("unsafe chunk default");
        let hit = false;
        try { assertCostCeiling(2, 1); } catch { hit = true; }
        if (!hit) throw new Error("ceiling failed open");
        `,
      ],
      { encoding: "utf8" },
    );
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
  });

  it("fail-closes without an API key and never writes secrets into the repo lab folder", () => {
    const result = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `
        import { synthesizeCedar } from ${JSON.stringify(join(ROOT, "scripts/voice-lab/cedar.mjs"))};
        await synthesizeCedar({
          text: "Hello from the edge of sleep.",
          words: 6,
          outDir: "/tmp/pex-voice-lab-test",
          execute: true,
          env: { OPENAI_API_KEY: "", VOICE_LAB_COST_CEILING_USD: "1" },
          fetchImpl: async () => { throw new Error("network should not run"); },
        });
        `,
      ],
      { encoding: "utf8" },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr + result.stdout).toMatch(/OPENAI_API_KEY missing/);
    const lab = readFileSync(join(ROOT, "publication/audio/voice-lab/GENERATION-MANIFEST.json"), "utf8");
    expect(lab).not.toMatch(/sk-[A-Za-z0-9]/);
    expect(lab).toContain("dry-run");
  });

  it("does not network-post local scores (lab HTML stores localStorage only)", () => {
    const html = readFileSync(join(ROOT, "publication/audio/voice-lab/lab.html"), "utf8");
    expect(html).toContain("localStorage");
    expect(html).not.toMatch(/fetch\([^)]+method:\s*["']POST/i);
    expect(html).toContain("Nothing is uploaded");
  });
});
