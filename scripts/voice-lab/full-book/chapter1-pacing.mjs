import { SECTION_PAUSE_MS } from "../core.mjs";

/** Deterministic section-heading silence for Chapter 1 (audio pacing only). */

export const CHAPTER1_SECTION_HEADINGS = [
  "Why “Psychical”?",
  "I Want Psychic Super Powers",
  "The Body Is Part of the Experiment",
  "The Dreaming Mind",
  "Out of Body",
  "What This Book Actually Does",
  "No Grades, No Gurus",
  "The Excursion",
];

/** Targets from work order (ms). */
export const CHAPTER1_PAUSE_BEFORE_HEADING_MS = 1250;
export const CHAPTER1_PAUSE_AFTER_HEADING_MS = 1750;
/** After “The Excursion” before existing section-pause before Wilson prose. */
export const CHAPTER1_PAUSE_AFTER_EXCURSION_MS = 1250;

function splitSpeechByHeadings(text, headings) {
  let pieces = [text];
  for (const heading of headings) {
    const next = [];
    for (const piece of pieces) {
      if (typeof piece !== "string") {
        next.push(piece);
        continue;
      }
      const idx = piece.indexOf(heading);
      if (idx < 0) {
        next.push(piece);
        continue;
      }
      const before = piece.slice(0, idx);
      const after = piece.slice(idx + heading.length);
      if (before.trim()) next.push(before);
      next.push({ heading });
      if (after.trim()) next.push(after);
    }
    pieces = next;
  }
  return pieces;
}

/**
 * Insert real silence before/after each spoken section title in Chapter 1.
 * @param {Array<{type: string, text?: string, ms?: number}>} segments
 */
export function applyChapter1HeadingPauses(segments) {
  const out = [];
  const pauseLog = [];

  for (const segment of segments) {
    if (segment.type === "pause") {
      out.push(segment);
      continue;
    }
    const pieces = splitSpeechByHeadings(segment.text, CHAPTER1_SECTION_HEADINGS);
    for (const piece of pieces) {
      if (typeof piece === "string") {
        const text = piece.trim();
        if (text) out.push({ type: "speech", text });
        continue;
      }
      const heading = piece.heading;
      out.push({
        type: "pause",
        ms: CHAPTER1_PAUSE_BEFORE_HEADING_MS,
        label: `before:${heading}`,
      });
      pauseLog.push({ heading, position: "before", ms: CHAPTER1_PAUSE_BEFORE_HEADING_MS });
      out.push({ type: "speech", text: heading, section_heading: true });
      const afterMs =
        heading === "The Excursion" ? CHAPTER1_PAUSE_AFTER_EXCURSION_MS : CHAPTER1_PAUSE_AFTER_HEADING_MS;
      out.push({ type: "pause", ms: afterMs, label: `after:${heading}` });
      pauseLog.push({ heading, position: "after", ms: afterMs });
    }
  }

  const final = ensureExcursionWilsonSectionPause(out);
  if (final.length > out.length) {
    pauseLog.push({
      heading: "The Excursion → Robert Anton Wilson",
      position: "section-pause",
      ms: SECTION_PAUSE_MS,
    });
  }
  return { segments: final, pause_log: pauseLog };
}

/** Stronger break after “The Excursion” before Wilson prose (section-pause + heading after-pause). */
export function ensureExcursionWilsonSectionPause(segments) {
  const out = [];
  for (let i = 0; i < segments.length; i++) {
    out.push(segments[i]);
    const next = segments[i + 1];
    if (
      segments[i].type === "pause" &&
      segments[i].label === "after:The Excursion" &&
      next?.type === "speech" &&
      next.text.startsWith("Robert Anton Wilson")
    ) {
      out.push({
        type: "pause",
        ms: SECTION_PAUSE_MS,
        label: "section-pause:before-wilson",
      });
    }
  }
  return out;
}
