import { DAY_COUNT } from "../domain/types.ts";
import type { CurriculumPacket, DayDocument, DaySection } from "./model.ts";
import { OPTIONAL_TIMING_DAY, phaseForDay } from "./phases.ts";

const FIXTURE_BANNER =
  "DEVELOPMENT FIXTURE — not canonical curriculum. This copy exists only so routes, progress, typography, and offline shell can be built while PEx Primary transports the locked Days 1–60 packet. It must not remain when requesting Complete Product acceptance.";

function fixtureSections(day: number): DaySection[] {
  const longStress = [
    "FIXTURE LONG-FORM STRESS TEXT. This paragraph is repeated structural filler for reading-column, focus, and reduced-motion checks. It is not a lesson, method, or practice instruction.",
    "Section order here is a development scaffold: Orientation, then Notes, then Close. The canonical packet will replace these headings and paragraphs in the same renderer without changing route or progress behavior.",
    "Do not treat anything on this screen as a day practice. There are no breathing counts, no sleep-paralysis instructions, no supplements, no guaranteed results, and no claim that consciousness leaves the body.",
  ];
  const sections: DaySection[] = [
    {
      heading: "Orientation (fixture)",
      paragraphs: [FIXTURE_BANNER, `Structural slot for locked Day ${day} once the Primary packet is integrated.`],
    },
    {
      heading: "Notes (fixture)",
      paragraphs: longStress,
    },
    {
      heading: "Close (fixture)",
      paragraphs: [
        "Returning capture stays in the primary navigation. Completion is explicit; scrolling this fixture does not complete the day.",
      ],
    },
  ];
  if (day === OPTIONAL_TIMING_DAY) {
    sections.unshift({
      heading: "Optional timing experiment (fixture marker)",
      paragraphs: [
        "Day 51 is the only deliberately disruptive optional timing experiment. Skip it without penalty. This marker is structural; canonical wording will replace the fixture paragraphs.",
      ],
    });
  }
  return sections;
}

function fixtureDay(day: number): DayDocument {
  const phase = phaseForDay(day);
  if (!phase) throw new Error(`No phase for day ${day}`);
  const optional = day === OPTIONAL_TIMING_DAY;
  return {
    day,
    phaseId: phase.id,
    title: `Day ${day} — DEVELOPMENT FIXTURE`,
    optional,
    optionalNote: optional
      ? "Optional. Skip without penalty. DEVELOPMENT FIXTURE marker until the locked packet arrives."
      : null,
    sections: fixtureSections(day),
    source: "development-fixture",
  };
}

export function developmentFixturePacket(): CurriculumPacket {
  return {
    revision: null,
    source: "development-fixture",
    days: Array.from({ length: DAY_COUNT }, (_, index) => fixtureDay(index + 1)),
  };
}
