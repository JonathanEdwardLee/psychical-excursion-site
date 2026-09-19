import { describe, expect, it } from "vitest";
import { sectionDisplayHeading, sectionKind } from "./instructionDisplay.ts";

describe("day instruction display", () => {
  it("maps canonical headings to participant labels", () => {
    expect(sectionDisplayHeading("PRACTICE")).toBe("Do this");
    expect(sectionDisplayHeading("TODAY")).toBe("Before you begin");
    expect(sectionKind("PRACTICE")).toBe("practice");
  });
});
