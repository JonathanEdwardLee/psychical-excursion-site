import { CANONICAL_PACKET } from "./canonical.ts";
import { guidedDoThisForDay } from "./participantDoThis.ts";
import type { DayDocument, DaySection } from "./model.ts";

/** Participant-facing plain titles (canonical source titles remain internal). */
export const PLAIN_TITLES: readonly string[] = [
  "Remember a dream fragment when you wake",
  "Practice remembering at everyday cues",
  "Release tension in the body",
  "Follow the breath for five minutes",
  "Focus on one small point in your palm",
  "Trace a slow line on your hand",
  "Stir sensation in the center of your palm",
  "Brush attention across one open hand",
  "Work attention through each finger",
  "Work attention through one foot",
  "Draw attention up one arm",
  "Draw attention up one leg",
  "Move attention through the arm, not over it",
  "Run the full attention circuit once",
  "Hold one physical sensation steady",
  "Catch when attention starts to drift",
  "Open attention to a wider field",
  "Alternate narrow and wide attention",
  "Keep a chosen motion alive in attention",
  "Hold two layers of sensation at once",
  "Carry a thread of attention into sleep",
  "Look for something gently impossible",
  "Rehearse remembering tomorrow’s intention",
  "Question whether you are awake or dreaming",
  "Rehearse recognizing the dream state",
  "Carry your intention as you fall asleep",
  "Use a natural night waking if one comes",
  "Practice waking inside the dream",
  "Rehearse the first moment of lucidity",
  "Run a full recognition practice tonight",
  "Watch the dark behind closed eyes",
  "Listen inward without naming sounds",
  "Feel the whole body field at once",
  "Notice sight, sound, and body together",
  "Let attention move in lighter cycles",
  "Let imagery form without forcing it",
  "Notice how the body is mapped in mind",
  "Observe the edge between wake and sleep",
  "Rock attention gently in the body",
  "Roll attention through the body",
  "Glide attention smoothly",
  "Float attention with less effort",
  "Reach toward a point without moving",
  "Move attention toward one point",
  "Sustain one small motion in attention",
  "Let the motion lead your attention",
  "Build a short sequence of motions",
  "Try one attempt after a natural awakening",
  "Shorten your sequence to the essentials",
  "Bridge from lucid dream back to calm wakefulness",
  "Try one timed attempt window",
  "Strengthen one thread of intention",
  "Lighten the same thread of intention",
  "Commit to one entry route for tonight",
  "Choose the easiest entry you know",
  "Remove one step from your routine",
  "Hold one clear intention only",
  "Follow the first change you notice",
  "One entry, one action, then stop",
  "Choose your own simple attempt, then sleep",
] as const;

const OLD_MODULE_TITLE = new Set(
  CANONICAL_PACKET.days.map((document) => document.title),
);

function findSection(document: DayDocument, heading: string): DaySection | undefined {
  return document.sections.find((section) => section.heading === heading);
}

export type ParticipantDayView = {
  displayTitle: string;
  setup: string[];
  doThis: string[];
  supporting: DaySection[];
};

export function participantViewFor(document: DayDocument): ParticipantDayView {
  const setup = findSection(document, "TODAY")?.paragraphs ?? [];
  const practice = findSection(document, "PRACTICE");
  const tonight = findSection(document, "TONIGHT");
  const doThis = [...guidedDoThisForDay(document.day)];
  const supporting: DaySection[] = [];
  if (practice && tonight) supporting.push(tonight);
  for (const heading of ["AFFIRMATION", "RESEARCH NOTE"] as const) {
    const section = findSection(document, heading);
    if (section) supporting.push(section);
  }
  const displayTitle = PLAIN_TITLES[document.day - 1] ?? `Day ${document.day} practice`;
  return { displayTitle, setup, doThis, supporting };
}

export function isOldModuleTitle(title: string): boolean {
  return OLD_MODULE_TITLE.has(title);
}

if (PLAIN_TITLES.length !== 60) {
  throw new Error(`Expected 60 plain titles, got ${PLAIN_TITLES.length}`);
}
