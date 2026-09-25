import { describe, expect, it } from "vitest";
import { loadGuidebookChapter03 } from "./guidebookChapter03.ts";
import { loadGuidebookChapter04 } from "./guidebookChapter04.ts";
import { loadGuidebookChapter05 } from "./guidebookChapter05.ts";
import { loadGuidebookChapter06 } from "./guidebookChapter06.ts";
import { loadGuidebookChapter07 } from "./guidebookChapter07.ts";
import { loadGuidebookChapter09 } from "./guidebookChapter09.ts";
import { loadGuidebookChapter10 } from "./guidebookChapter10.ts";
import { loadGuidebookChapter11 } from "./guidebookChapter11.ts";
import { loadGuidebookChapter12 } from "./guidebookChapter12.ts";
import { loadGuidebookChapter13 } from "./guidebookChapter13.ts";
import { loadGuidebookChapter15 } from "./guidebookChapter15.ts";
import { loadGuidebookManuscript } from "./guidebookManuscript.ts";
import { RELAX_THE_BODY_HREF } from "./guidebookAnchors.ts";

function dump(value: unknown): string {
  return JSON.stringify(value);
}

describe("guidebook chapter cross-references", () => {
  it("uses linked 01–23 numbers instead of stale Chapter N prose", () => {
    expect(dump(loadGuidebookChapter03())).toContain("[**03**](/dream-awareness-signs/)");
    expect(dump(loadGuidebookChapter04())).toContain("So this chapter really begins two practices.");
    expect(dump(loadGuidebookChapter04())).not.toMatch(/Chapter 4 really begins/);
    expect(dump(loadGuidebookChapter05())).toContain("[**05**](/body-scan-meditation/)");
    expect(dump(loadGuidebookChapter05())).toContain("[**02**](/dream-recall/)");
    expect(dump(loadGuidebookChapter05())).toContain(`[**Relax the body**](${RELAX_THE_BODY_HREF})`);
    expect(dump(loadGuidebookChapter06())).toContain("[**06**](/attention-body-awareness/)");
    expect(dump(loadGuidebookChapter06())).toContain("[**08**](/meditation-for-lucid-dreaming/)");
    expect(dump(loadGuidebookChapter07())).toContain("[**07**](/energy-sensations-meditation/)");
    expect(dump(loadGuidebookChapter07())).toContain("because this chapter is ultimately about");
    expect(dump(loadGuidebookChapter09())).toContain("[**09**](/visualization-hypnagogic-imagery/)");
    expect(dump(loadGuidebookChapter10())).toContain("[**12**](/motor-imagery-lucid-dreaming/)");
    expect(dump(loadGuidebookChapter11())).toContain("[**11**](/mind-awake-body-asleep/)");
    expect(dump(loadGuidebookChapter12())).toContain("[**12**](/motor-imagery-lucid-dreaming/)");
    expect(dump(loadGuidebookChapter13())).toContain("[**13**](/out-of-body-sensations-sleep/)");
    expect(dump(loadGuidebookChapter13())).toContain("[**15**](/lucid-dream-stabilization/)");
    expect(dump(loadGuidebookChapter15())).toContain("[**15**](/lucid-dream-stabilization/)");
  });

  it("leaves no stale Chapter-number book references in audited manuscripts", () => {
    const corpus = [
      loadGuidebookManuscript(),
      loadGuidebookChapter03(),
      loadGuidebookChapter04(),
      loadGuidebookChapter05(),
      loadGuidebookChapter06(),
      loadGuidebookChapter07(),
      loadGuidebookChapter09(),
      loadGuidebookChapter10(),
      loadGuidebookChapter11(),
      loadGuidebookChapter12(),
      loadGuidebookChapter13(),
      loadGuidebookChapter15(),
    ].map(dump).join("\n");
    expect(corpus).not.toMatch(/\bChapter\s+\d+\b/);
    expect(corpus).not.toMatch(/#\/feel-the-body/);
  });
});
