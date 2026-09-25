#!/usr/bin/env node
/**
 * Deterministic session scripts from Publication Master chapters.
 * Does not mutate chapters/ or Web Edition. Does not generate audio.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { narrationView, PUBLICATION_CHAPTERS } from "./generate-publication-master.mjs";

export const AUDIO_PRODUCTION_BASELINE = "c08aa9c5265af96d7c7f8b38a1cd11a38653e858";
export const PLANNING_WPM = 150;
export const WPM_RATES = [135, 150, 165];
export const PILOT_MENU = "10";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUB = join(ROOT, "publication");
const OUT = join(PUB, "audio", "session-scripts");

const CUE_SHORT = "<!-- cue:short-pause -->";
const CUE_SECTION = "<!-- cue:section-pause -->";
const CUE_REFLECT = "<!-- cue:reflective-pause -->";
const CUE_PRACTICE = "<!-- cue:optional-practice-pause -->";

const PRONUNCIATION_TERMS = [
  { id: "rinpoche", re: /Rinpoche/ },
  { id: "laberge", re: /LaBerge/ },
  { id: "bon", re: /Bön|\bBon\b/ },
  { id: "qigong", re: /qigong/i },
  { id: "dantian", re: /dantian/i },
  { id: "hypnagogia", re: /hypnagog/i },
  { id: "interoception", re: /interocept/i },
  { id: "proprioception", re: /propriocept/i },
  { id: "vestibular", re: /vestibular/i },
  { id: "mild", re: /\bMILD\b/ },
  { id: "ssild", re: /\bSSILD\b/ },
  { id: "wbtb", re: /\bWBTB\b|wake-back-to-bed|Wake Back to Bed/i },
  { id: "rem", re: /\bREM\b|\bNREM\b/ },
  { id: "obe", re: /\bOBE\b/ },
  { id: "eeg", re: /\bEEG\b|\bMEG\b/ },
];

const EXERCISE_RE =
  /Relax the body|Intention|remain still|Ask yourself|Ask occasionally|body scan|When you are ready|Let yourself fall asleep|Next time I am dreaming/i;

const CARDINALS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen", "twenty", "twenty-one", "twenty-two", "twenty-three",
];

export function stripYaml(text) {
  if (!text.startsWith("---\n")) return text;
  const end = text.indexOf("\n---\n", 4);
  if (end < 0) return text;
  return text.slice(end + 5);
}

export function stripUnspokenIdentifiers(text) {
  return text
    .replace(/https?:\/\/[^\s)]+/g, "")
    .replace(/\bdoi:\s*10\.\S+/gi, "")
    .replace(/\bPMID:?\s*\d+/gi, "")
    .replace(/\b10\.\d{4,}\/\S+/g, "")
    .replace(/^---+$/gm, "");
}

export function stripMarkdownSpeech(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^>\s?/gm, "");
}

export function minutesAt(words, wpm) {
  return Math.round((words / wpm) * 10) / 10;
}

export function countWords(text) {
  return spokenOnly(text).trim().split(/\s+/).filter(Boolean).length;
}

export function spokenOnly(script) {
  return script.replace(/<!--[\s\S]*?-->/g, " ").replace(/\r\n/g, "\n");
}

function headingToSpeech(line) {
  const match = line.match(/^(#{1,6})\s+(.*)$/);
  if (!match) return null;
  return match[2].trim();
}

function applyCues(body) {
  const lines = body.split("\n");
  const out = [];
  for (const line of lines) {
    const heading = headingToSpeech(line);
    if (heading) {
      out.push("", CUE_SHORT, heading, "");
      continue;
    }
    if (/^Ask (yourself|occasionally):?\s*$/i.test(line.trim()) || /^\*\*Does /.test(line.trim())) {
      out.push(CUE_REFLECT, stripMarkdownSpeech(line));
      continue;
    }
    if (/remain still|Let yourself fall asleep|When you are ready for sleep/i.test(line)) {
      out.push(stripMarkdownSpeech(line), CUE_PRACTICE);
      continue;
    }
    out.push(line);
  }
  return stripMarkdownSpeech(out.join("\n")).replace(/\n{3,}/g, "\n\n").trim();
}

export function renderChapterScript({ menu, title, sourcePath, adaptedWithYaml }) {
  const withoutYaml = stripYaml(adaptedWithYaml);
  const spoken = stripUnspokenIdentifiers(narrationView(withoutYaml));
  const body = applyCues(spoken.replace(/^#\s+[^\n]+\n+/, ""));
  const n = Number(menu);
  const header = [
    "<!-- PEX session script: production cues only. Not canonical prose. -->",
    `<!-- source: ${sourcePath} -->`,
    `<!-- menu: ${menu} -->`,
    `<!-- output: PEX-AUDIO-${menu}-${sourcePath.replace(/^chapters\/\d+-/, "").replace(/\.md$/, "")} -->`,
    "",
    `Chapter ${CARDINALS[n]}.`,
    "",
    title.replace(/:$/, ""),
    "",
    CUE_SHORT,
    "",
  ].join("\n");
  return `${header}${body}\n`;
}

function pronunciationFlags(text) {
  return PRONUNCIATION_TERMS.filter((term) => term.re.test(text)).map((term) => term.id);
}

function exerciseFlags(text) {
  const flags = [];
  if (EXERCISE_RE.test(text)) flags.push("has-practice-prose");
  if (/Relax the body/i.test(text)) flags.push("relax-the-body");
  if (/Intention/.test(text)) flags.push("intention");
  if (/Let yourself fall asleep/i.test(text)) flags.push("sleep-onset");
  return flags;
}

function openingCreditsScript() {
  return `<!-- PEX session script: opening credits. Not canonical chapter prose. -->
<!-- output: PEX-AUDIO-00-opening-credits -->

Psychical Excursion.

A researched experiment in dreams, attention, and the edge of sleep.

Created by Hoopsnake Designs.
`;
}

function closingCreditsScript() {
  return `<!-- PEX session script: closing credits. Not canonical chapter prose. -->
<!-- output: PEX-AUDIO-99-closing-credits -->

You have been listening to Psychical Excursion, written by Jonathan Lee, narrated by — narrator to be confirmed.

${CUE_SHORT}

The End.
`;
}

function matterScript({ id, sourceRel, spokenTitle, body }) {
  const withoutSourceHeading = stripYaml(body).replace(/^#\s+.*\n+/, "");
  const cleaned = applyCues(stripUnspokenIdentifiers(stripMarkdownSpeech(withoutSourceHeading)))
    .replace(/psychicalexcursion\.com/g, "psychicalexcursion.com")
    .replace(/https:\/\/psychicalexcursion\.com/g, "psychicalexcursion.com");
  return `<!-- PEX session script: front or back matter. Not a chapter rewrite. -->
<!-- source: ${sourceRel} -->
<!-- output: ${id} -->

${spokenTitle}

${CUE_SHORT}

${cleaned}
`;
}

export function buildSessionScripts() {
  mkdirSync(OUT, { recursive: true });
  const pubManifest = JSON.parse(readFileSync(join(PUB, "manifest.json"), "utf8"));
  const tracks = [];
  let chapterNarrationWords = 0;

  const opening = openingCreditsScript();
  writeFileSync(join(OUT, "00-opening-credits.md"), opening);
  tracks.push(trackRecord({
    sequence: 0,
    menu: null,
    title: "Opening credits",
    source: "publication/audio/CREDITS.md",
    script: "audio/session-scripts/00-opening-credits.md",
    basename: "PEX-AUDIO-00-opening-credits",
    words: countWords(opening),
    pronunciation: [],
    exercise: [],
    kind: "credits",
  }));

  const matter = [
    {
      file: "00a-how-this-book-treats-evidence.md",
      source: "front-matter/EVIDENCE-AND-BELIEF.md",
      id: "PEX-AUDIO-00a-evidence-and-belief",
      title: "How this book treats evidence",
      spokenTitle: "How this book treats evidence.",
    },
    {
      file: "00b-sleep-and-safety.md",
      source: "front-matter/SLEEP-AND-SAFETY.md",
      id: "PEX-AUDIO-00b-sleep-and-safety",
      title: "Sleep and safety",
      spokenTitle: "Sleep and safety.",
    },
  ];
  let seq = 1;
  for (const item of matter) {
    const raw = readFileSync(join(PUB, item.source), "utf8");
    const script = matterScript({
      id: item.id,
      sourceRel: item.source,
      spokenTitle: item.spokenTitle,
      body: raw,
    });
    writeFileSync(join(OUT, item.file), script);
    tracks.push(trackRecord({
      sequence: seq,
      menu: null,
      title: item.title,
      source: item.source,
      script: `audio/session-scripts/${item.file}`,
      basename: item.id,
      words: countWords(script),
      pronunciation: pronunciationFlags(raw),
      exercise: [],
      kind: "front-matter",
    }));
    seq += 1;
  }

  for (const entry of PUBLICATION_CHAPTERS) {
    const sourcePath = `chapters/${entry.slug}.md`;
    const adapted = readFileSync(join(PUB, sourcePath), "utf8");
    const title = JSON.parse(
      adapted.match(/^title:\s+(\S.*)$/m)?.[1] ?? JSON.stringify(entry.slug),
    );
    let script = renderChapterScript({
      menu: entry.menu,
      title,
      sourcePath,
      adaptedWithYaml: adapted,
    });
    if (entry.menu === "01") {
      script = script.replace(
        `${CUE_SHORT}\nThe Excursion\n\nRobert Anton Wilson was another major influence`,
        `${CUE_SHORT}\nThe Excursion\n\n${CUE_SECTION}\n\nRobert Anton Wilson was another major influence`,
      );
    }
    const outName = `${entry.slug}.md`;
    writeFileSync(join(OUT, outName), script);
    const words = countWords(script);
    const pubWords = pubManifest.chapters.find((c) => c.menu === entry.menu)
      ?.narration_words_excluding_references ?? 0;
    chapterNarrationWords += pubWords;
    const flags = pronunciationFlags(adapted);
    const exercises = exerciseFlags(adapted);
    const split =
      pubWords >= 4000
        ? "optional-internal-segments; keep one final chapter track"
        : "single-session";
    tracks.push(trackRecord({
      sequence: seq,
      menu: Number(entry.menu),
      title,
      source: sourcePath,
      script: `audio/session-scripts/${outName}`,
      basename: `PEX-AUDIO-${entry.menu}-${entry.slug.replace(/^\d+-/, "")}`,
      words,
      pubNarrationWords: pubWords,
      pronunciation: flags,
      exercise: exercises,
      kind: "chapter",
      session: split,
    }));
    seq += 1;
  }

  const about = readFileSync(join(PUB, "back-matter/ABOUT-THE-AUTHOR.md"), "utf8");
  const aboutScript = matterScript({
    id: "PEX-AUDIO-24-about-the-author",
    sourceRel: "back-matter/ABOUT-THE-AUTHOR.md",
    spokenTitle: "About the author.",
    body: about.replace(/https:\/\/psychicalexcursion\.com/g, "psychicalexcursion.com")
      .replace(/This note uses only facts already authorized in `knowledge\/authorvoice.md` and the accepted manuscript. It does not add new autobiography.\n?/g, ""),
  });
  writeFileSync(join(OUT, "24-about-the-author.md"), aboutScript);
  tracks.push(trackRecord({
    sequence: seq,
    menu: null,
    title: "About the author",
    source: "back-matter/ABOUT-THE-AUTHOR.md",
    script: "audio/session-scripts/24-about-the-author.md",
    basename: "PEX-AUDIO-24-about-the-author",
    words: countWords(aboutScript),
    pronunciation: pronunciationFlags(about),
    exercise: [],
    kind: "back-matter",
  }));
  seq += 1;

  const cont = readFileSync(join(PUB, "back-matter/CONTINUE.md"), "utf8");
  const contScript = matterScript({
    id: "PEX-AUDIO-25-continue-the-experiment",
    sourceRel: "back-matter/CONTINUE.md",
    spokenTitle: "Continue the experiment.",
    body: cont.replace(/https:\/\/psychicalexcursion\.com/g, "psychicalexcursion.com"),
  });
  writeFileSync(join(OUT, "25-continue-the-experiment.md"), contScript);
  tracks.push(trackRecord({
    sequence: seq,
    menu: null,
    title: "Continue the experiment",
    source: "back-matter/CONTINUE.md",
    script: "audio/session-scripts/25-continue-the-experiment.md",
    basename: "PEX-AUDIO-25-continue-the-experiment",
    words: countWords(contScript),
    pronunciation: [],
    exercise: [],
    kind: "back-matter",
  }));
  seq += 1;

  const closing = closingCreditsScript();
  writeFileSync(join(OUT, "99-closing-credits.md"), closing);
  tracks.push(trackRecord({
    sequence: seq,
    menu: null,
    title: "Closing credits",
    source: "publication/audio/CREDITS.md",
    script: "audio/session-scripts/99-closing-credits.md",
    basename: "PEX-AUDIO-99-closing-credits",
    words: countWords(closing),
    pronunciation: [],
    exercise: [],
    kind: "credits",
  }));

  const chapterTracks = tracks.filter((t) => t.kind === "chapter");
  const totals = {
    publication_narration_words: pubManifest.narration_words_excluding_references,
    session_script_chapter_words: chapterTracks.reduce((sum, t) => sum + t.narration_word_count, 0),
    estimates_minutes: Object.fromEntries(
      WPM_RATES.map((wpm) => [
        `wpm_${wpm}`,
        minutesAt(pubManifest.narration_words_excluding_references, wpm),
      ]),
    ),
  };
  const longest = [...chapterTracks].sort((a, b) => b.publication_narration_words - a.publication_narration_words)[0];
  const shortest = [...chapterTracks].sort((a, b) => a.publication_narration_words - b.publication_narration_words)[0];

  const audioManifest = {
    edition: "audiobook-production-plan",
    publication_master_baseline: AUDIO_PRODUCTION_BASELINE,
    web_edition_baseline: pubManifest.web_edition_baseline,
    planning_wpm: PLANNING_WPM,
    wpm_rates: WPM_RATES,
    recommended_pilot_menu: Number(PILOT_MENU),
    recommended_pilot_path: "jonathan-narrates-one-chapter-pilot",
    no_audio_files: true,
    totals,
    longest_chapter: { menu: longest.chapter_number, title: longest.title, publication_narration_words: longest.publication_narration_words },
    shortest_chapter: { menu: shortest.chapter_number, title: shortest.title, publication_narration_words: shortest.publication_narration_words },
    session_split_rule: "Default one chapter equals one final track. Optional internal recording segments only if a chapter exceeds about 4000 narration words (currently menu 21).",
    tracks,
  };

  writeFileSync(join(PUB, "audio", "TRACK-MANIFEST.json"), `${JSON.stringify(audioManifest, null, 2)}\n`);
  writeFileSync(
    join(OUT, "README.md"),
    [
      "# Session scripts",
      "",
      "Generated from `publication/chapters` by `scripts/generate-session-scripts.mjs`.",
      "HTML comments are production cues. They are not spoken.",
      "Do not edit these files by hand; regenerate.",
      "",
    ].join("\n"),
  );

  const leftover = readdirSync(OUT).filter(
    (name) => name.endsWith(".md") && name !== "README.md",
  );
  return { tracks: leftover.length, totals, longest, shortest };
}

function trackRecord({
  sequence,
  menu,
  title,
  source,
  script,
  basename,
  words,
  pubNarrationWords = null,
  pronunciation,
  exercise,
  kind,
  session = "single-session",
}) {
  const planning = minutesAt(pubNarrationWords ?? words, PLANNING_WPM);
  return {
    sequence,
    kind,
    chapter_number: menu,
    title,
    source_publication_file: source,
    session_script: script,
    narration_word_count: words,
    publication_narration_words: pubNarrationWords,
    estimated_duration_minutes: {
      wpm_135: minutesAt(pubNarrationWords ?? words, 135),
      wpm_150: planning,
      wpm_165: minutesAt(pubNarrationWords ?? words, 165),
    },
    pronunciation_flags: pronunciation,
    exercise_pause_flags: exercise,
    recording_session: session,
    status: "script-only",
    output_basename: basename,
    audio_hash: null,
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const result = buildSessionScripts();
  process.stdout.write(
    `Session scripts: ${result.tracks} files. Longest menu ${result.longest.chapter_number}. Pilot menu ${PILOT_MENU}.\n`,
  );
}
