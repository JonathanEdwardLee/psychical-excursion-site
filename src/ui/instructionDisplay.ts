/** Participant-facing labels for canonical section headings (packet text unchanged). */
export function sectionDisplayHeading(heading: string): string {
  const key = heading.trim().toUpperCase();
  switch (key) {
    case "TODAY":
      return "Before you begin";
    case "PRACTICE":
      return "Do this";
    case "TONIGHT":
      return "Tonight";
    case "AFFIRMATION":
      return "Affirmation";
    case "RESEARCH NOTE":
      return "Reference note";
    default:
      return heading;
  }
}

export function sectionKind(heading: string): "setup" | "practice" | "research" | "other" {
  const key = heading.trim().toUpperCase();
  if (key === "TODAY") return "setup";
  if (key === "PRACTICE") return "practice";
  if (key === "RESEARCH NOTE") return "research";
  return "other";
}
