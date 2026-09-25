/**
 * Shared Voice Lab helpers. No network. No secrets.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export const CHAPTER10_SCRIPT = "publication/audio/session-scripts/10-watch-the-edge.md";
export const DEFAULT_COST_CEILING_USD = 1;
export const CEDAR_MODEL = "gpt-4o-mini-tts";
export const CEDAR_VOICE = "cedar";
export const MARIN_VOICE = "marin";
export const MAX_SPEECH_INPUT_CHARS = 1800;
export const OPENAI_INPUT_TOKEN_LIMIT = 2000;

/** Conservative planning rate from OpenAI model card (~$0.015/min). Not a billed receipt. */
export const CEDAR_USD_PER_MINUTE_ESTIMATE = 0.015;
export const COST_BUFFER = 1.35;

export const DEFAULT_INSTRUCTIONS = [
  "Conversational researched nonfiction.",
  "Curious rather than mystical.",
  "Warm but not a meditation-app whisper.",
  "Preserve mild humor and short punch lines.",
  "Pronounce technical terms clearly (EEG, N1, hypnagogia, REM).",
  "Moderate pace.",
  "Exercises slightly calmer, not whispered.",
  "Read the text exactly. Do not add commentary or invented words.",
].join(" ");

export function spokenOnly(script) {
  return script.replace(/<!--[\s\S]*?-->/g, "\n").replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function loadChapter10FromFs(filePath) {
  return readFileSync(filePath, "utf8");
}

export function chapter10Path(root) {
  return `${root.replace(/\/$/, "")}/${CHAPTER10_SCRIPT}`;
}

/**
 * Representative 3–5 minute excerpt: research, humor, EEG/hypnagogia, reflective question, sleep-onset instruction.
 * Verbatim spoken text from the session script; cues already removed.
 */
export function selectPilotExcerpt(scriptRaw) {
  const spoken = spokenOnly(scriptRaw);
  const endMarker = "It is when thought stops explaining itself.";
  const idx = spoken.indexOf(endMarker);
  if (idx < 0) throw new Error("Chapter 10 excerpt end marker missing");
  const excerpt = spoken.slice(0, idx + endMarker.length).trim();
  const words = countWords(excerpt);
  if (words < 350 || words > 900) {
    throw new Error(`Excerpt word count ${words} outside 3–5 minute planning band`);
  }
  if (!/Let yourself fall asleep/.test(excerpt)) throw new Error("excerpt missing exercise line");
  if (!/EEG/.test(excerpt) || !/Hypnagogia|hypnagog/i.test(excerpt)) {
    throw new Error("excerpt missing technical terms");
  }
  if (!/Ask occasionally/.test(excerpt)) throw new Error("excerpt missing reflective transition");
  return { excerpt, words, sha256: sha256(excerpt), sourceSha256: sha256(scriptRaw) };
}

export function chunkForSpeechApi(text, maxChars = MAX_SPEECH_INPUT_CHARS) {
  const blocks = text.split(/\n\n+/);
  const chunks = [];
  let current = "";
  for (const block of blocks) {
    const piece = block.trim();
    if (!piece) continue;
    if (piece.length > maxChars) {
      throw new Error("Paragraph exceeds speech API chunk size; split the session script, do not rewrite prose");
    }
    if (!current) {
      current = piece;
      continue;
    }
    if (`${current}\n\n${piece}`.length <= maxChars) {
      current = `${current}\n\n${piece}`;
    } else {
      chunks.push(current);
      current = piece;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export function estimateCedarUsd(words, includeMarin = false) {
  const minutes = words / 150;
  const perPass = minutes * CEDAR_USD_PER_MINUTE_ESTIMATE * COST_BUFFER;
  const passes = includeMarin ? 2 : 1;
  return {
    planning_minutes_at_150wpm: Math.round(minutes * 10) / 10,
    conservative_usd_per_pass: Math.round(perPass * 10000) / 10000,
    conservative_usd_this_run: Math.round(perPass * passes * 10000) / 10000,
    note: "Estimate from OpenAI gpt-4o-mini-tts published ~$0.015/min plus 35% buffer. Not a billed receipt.",
  };
}

export function assertCostCeiling(estimateUsd, ceilingUsd) {
  if (estimateUsd > ceilingUsd) {
    throw new Error(
      `Pilot would exceed hard cost ceiling $${ceilingUsd} (estimate $${estimateUsd}). Refusing to call the API.`,
    );
  }
}

export function assertNoSecretLeak(haystack, key) {
  if (key && haystack.includes(key)) {
    throw new Error("secret would be persisted or logged");
  }
}
