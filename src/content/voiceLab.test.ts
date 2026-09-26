import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
// Production speech helpers live in JS modules under scripts/.
// @ts-expect-error — no .d.ts for core.mjs
import { parseSpokenSegments, SECTION_PAUSE_MARKER, spokenOnly } from "../../scripts/voice-lab/core.mjs";
const ROOT = join(import.meta.dirname, "../..");

describe("local AI narration voice lab", () => {
  it("keeps the Chapter 10 excerpt verbatim from the session script", () => {
    const script = readFileSync(
      join(ROOT, "publication/audio/session-scripts/10-watch-the-edge.md"),
      "utf8",
    );
    const excerpt = readFileSync(join(ROOT, "publication/audio/voice-lab/EXCERPT.md"), "utf8").trim();
    const normalize = (t: string) => t.replace(/\r\n/g, "\n");
    expect(normalize(spokenOnly(script))).toContain(normalize(excerpt));
    expect(excerpt).toContain("Let yourself fall asleep");
    expect(excerpt).toContain("EEG");
    expect(excerpt).toMatch(/Hypnagogia/);
    expect(excerpt).toContain("Ask occasionally");
    expect(excerpt).not.toMatch(/\[\d+\]/);
    expect(excerpt).not.toContain("## References");
    expect(excerpt).not.toMatch(/https?:\/\//);
  });

  it("chunks under the speech API input limit and enforces the cost ceiling", () => {
    const coreUrl = pathToFileURL(join(ROOT, "scripts/voice-lab/core.mjs")).href;
    const result = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `
        import { chunkForSpeechApi, assertCostCeiling, MAX_SPEECH_INPUT_CHARS } from "${coreUrl}";
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
    const cedarUrl = pathToFileURL(join(ROOT, "scripts/voice-lab/cedar.mjs")).href;
    const result = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `
        import { synthesizeCedar } from "${cedarUrl}";
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
    const manifest = JSON.parse(lab) as {
      cedar: {
        executed?: boolean;
        request_count?: number;
        skip?: string;
        files?: string[];
        compare_outputs_gitignored?: string[];
      };
    };
    const cedar = manifest.cedar;
    if (cedar.executed) {
      expect(cedar.executed).toBe(true);
      expect(cedar.request_count).toBe(3);
      for (const file of cedar.files ?? []) {
        expect(file).toMatch(/^local\//);
      }
      for (const file of cedar.compare_outputs_gitignored ?? []) {
        expect(file).toMatch(/^local\//);
      }
    } else {
      expect(cedar.executed).not.toBe(true);
      expect(JSON.stringify(cedar)).toMatch(/dry-run/i);
    }
  });

  it("strips publication YAML when chapter files use CRLF line endings", () => {
    const genUrl = pathToFileURL(join(ROOT, "scripts/generate-session-scripts.mjs")).href;
    const result = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `
        import { stripYaml } from "${genUrl}";
        const crlf = "---\\r\\nmenu: \\"01\\"\\r\\n---\\r\\n# Title\\r\\nBody.\\r\\n";
        const out = stripYaml(crlf);
        if (out !== "# Title\\nBody.\\n") throw new Error("stripYaml failed: " + JSON.stringify(out));
        `,
      ],
      { encoding: "utf8" },
    );
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
  });

  it("turns section-pause cues into assembly silence segments, not Cedar speech", () => {
    const script =
      "The Excursion\n\n<!-- cue:section-pause -->\n\nRobert Anton Wilson was another major influence.";
    const spoken = spokenOnly(script);
    expect(spoken).toContain(SECTION_PAUSE_MARKER);
    const segments = parseSpokenSegments(spoken);
    expect(segments).toHaveLength(3);
    expect(segments[1]).toMatchObject({ type: "pause", ms: 1750 });
    expect(segments[2].text).toContain("Robert Anton Wilson");
  });

  it("does not network-post local scores (lab HTML stores localStorage only)", () => {
    const html = readFileSync(join(ROOT, "publication/audio/voice-lab/lab.html"), "utf8");
    expect(html).toContain("localStorage");
    expect(html).not.toMatch(/fetch\([^)]+method:\s*["']POST/i);
    expect(html).toContain("Nothing is uploaded");
  });
});
