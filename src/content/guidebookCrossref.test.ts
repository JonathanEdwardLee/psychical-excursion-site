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
  it("keeps this-chapter cleanup and canonical Relax the body links", () => {
    expect(dump(loadGuidebookChapter03())).toContain("In the last chapter, we learned to notice the clues dreams give us");
    expect(dump(loadGuidebookChapter04())).toContain("So this chapter really begins two practices.");
    expect(dump(loadGuidebookChapter07())).toContain("because this chapter is ultimately about");
    expect(dump(loadGuidebookChapter05())).toContain(`[**Relax the body**](${RELAX_THE_BODY_HREF})`);
    expect(dump(loadGuidebookChapter06())).toContain(`[**Relax the body**](${RELAX_THE_BODY_HREF})`);
    expect(dump(loadGuidebookChapter07())).toContain(`[**Relax the body**](${RELAX_THE_BODY_HREF})`);
    expect(dump(loadGuidebookChapter09())).toContain(`[**Relax the body**](${RELAX_THE_BODY_HREF})`);
    expect(dump(loadGuidebookChapter10())).toContain(`[**Relax the body**](${RELAX_THE_BODY_HREF})`);
    expect(dump(loadGuidebookChapter15())).toContain("Lucidity, stability, and control are separate.");
  });

  it("removes stale Chapter N prose and nonessential numbered callbacks", () => {
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
    expect(corpus).not.toMatch(/\[\*\*\d+\*\*\]/);
  });
});
