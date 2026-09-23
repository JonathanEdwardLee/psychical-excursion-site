import { describe, expect, it } from "vitest";
import { ATTENTION_MOTION, renderAttentionInstrument } from "./attentionInstrument.ts";
import { RELAX_THE_BODY_HREF, RELAX_THE_BODY_LABEL } from "../content/guidebookAnchors.ts";
import { renderRichText } from "./guidebookRichText.ts";

describe("attention instrument", () => {
  it("renders nested geometric layers around a fixed center", () => {
    const figure = renderAttentionInstrument();
    expect(figure.getAttribute("role")).toBe("img");
    expect(figure.getAttribute("aria-label")).toMatch(/fixed center/i);
    expect(figure.getAttribute("aria-label")?.toLowerCase()).not.toMatch(/fail|theta|alpha|gamma|hz|brainwave|entrainment/);
    const svg = figure.querySelector("svg");
    expect(svg).toBeTruthy();
    const shapes = figure.querySelectorAll("circle, line, polygon, path");
    expect(shapes.length).toBeGreaterThan(250);
    expect(figure.querySelector(".pex-attention-spin-inner")).toBeTruthy();
    expect(figure.querySelector(".pex-attention-spin-mid")).toBeTruthy();
    expect(figure.querySelector(".pex-attention-spin-outer")).toBeTruthy();
    expect(figure.querySelector(".pex-attention-breathe")).toBeTruthy();
    expect(figure.querySelector(".pex-attention-beyond")).toBeTruthy();
    const point = figure.querySelector(".pex-attention-center-point");
    expect(point?.getAttribute("cx")).toBe("500");
    expect(point?.getAttribute("cy")).toBe("500");
    expect(svg?.style.getPropertyValue("--pex-attention-inner")).toBe(`${ATTENTION_MOTION.innerSeconds}s`);
    expect(svg?.style.getPropertyValue("--pex-attention-mid")).toBe(`${ATTENTION_MOTION.midSeconds}s`);
    expect(svg?.style.getPropertyValue("--pex-attention-outer")).toBe(`${ATTENTION_MOTION.outerSeconds}s`);
    expect(svg?.style.getPropertyValue("--pex-attention-breathe")).toBe(`${ATTENTION_MOTION.breatheSeconds}s`);
  });

  it("uses only slow motion periods and no flicker timings", () => {
    const periods = [
      ATTENTION_MOTION.innerSeconds,
      ATTENTION_MOTION.midSeconds,
      ATTENTION_MOTION.outerSeconds,
      ATTENTION_MOTION.breatheSeconds,
    ];
    for (const seconds of periods) {
      expect(seconds).toBeGreaterThanOrEqual(90);
    }
    expect(ATTENTION_MOTION.breatheScale).toBeLessThanOrEqual(1.04);
  });

  it("keeps full geometry static under reduced motion", () => {
    const prior = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes("prefers-reduced-motion: reduce"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
    const figure = renderAttentionInstrument();
    expect(figure.classList.contains("is-static")).toBe(true);
    expect(figure.querySelectorAll("circle, line, polygon, path").length).toBeGreaterThan(250);
    window.matchMedia = prior;
  });
});

describe("Relax the body link convention", () => {
  it("renders only the explicit pex destination as a Chapter 4 practice link", () => {
    const linked = renderRichText("Start with [Relax the body](pex:relax-the-body) then continue.");
    const anchor = linked.querySelector("a.guidebook-pex-link") as HTMLAnchorElement;
    expect(anchor).toBeTruthy();
    expect(anchor.getAttribute("href")).toBe(RELAX_THE_BODY_HREF);
    expect(anchor.textContent).toBe(RELAX_THE_BODY_LABEL);
    const plain = renderRichText("Please relax the body if it is tense.");
    expect(plain.querySelector("a.guidebook-pex-link")).toBeNull();
  });
});
