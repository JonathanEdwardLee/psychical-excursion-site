import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  AUDIOBOOK_CHECKOUT_PATH,
  AUDIOBOOK_PRICE_CENTS,
  AUDIOBOOK_PRICE_USD,
  AUDIOBOOK_SAMPLE_MP3_PATH,
} from "../content/audiobookDirectSale.ts";
import { AUDIOBOOK_GA4_EVENTS } from "../analytics/audiobookEvents.ts";
import { renderGuidebookAudiobook } from "../ui/pages/guidebookAudiobook.ts";
import { el } from "../ui/dom.ts";

function walkJsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkJsFiles(full));
    else if (entry.name.endsWith(".js")) out.push(full);
  }
  return out;
}

describe("PEX-DIRECT-SALE-001 implementation guards", () => {
  it("fixes product price at $11.11 USD", () => {
    expect(AUDIOBOOK_PRICE_USD).toBe(11.11);
    expect(AUDIOBOOK_PRICE_CENTS).toBe(1111);
  });

  it("uses same-origin checkout without Stripe.js in the storefront", () => {
    expect(AUDIOBOOK_CHECKOUT_PATH).toBe("/api/audiobook/checkout.php");
    expect(AUDIOBOOK_CHECKOUT_PATH).not.toMatch(/^https?:\/\//);
  });

  it("does not expose Stripe secret patterns in storefront source", () => {
    const srcDir = path.join(process.cwd(), "src");
    const files = walkJsFiles(srcDir).filter((file) => file.endsWith(".ts"));
    const blob = files.map((file) => readFileSync(file, "utf8")).join("\n");
    expect(blob).not.toMatch(/sk_live_/);
    expect(blob).not.toMatch(/sk_test_/);
    expect(blob).not.toContain("stripe_secret");
  });

  it("does not publish a static ZIP URL in the storefront module", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src", "ui", "pages", "guidebookAudiobook.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/\.zip/i);
    expect(AUDIOBOOK_SAMPLE_MP3_PATH).toMatch(/chapter-01\.mp3$/);
  });

  it("renders sample audio without autoplay", () => {
    window.gtag = () => {};
    const main = el("main", {});
    renderGuidebookAudiobook(main);
    const audio = main.querySelector("audio");
    expect(audio).toBeTruthy();
    expect(audio?.hasAttribute("autoplay")).toBe(false);
    expect(audio?.getAttribute("src")).toBe(AUDIOBOOK_SAMPLE_MP3_PATH);
  });

  it("keeps PHP payment verification on the server", () => {
    const successPhp = readFileSync(
      path.join(process.cwd(), "deploy", "api", "audiobook", "success.php"),
      "utf8",
    );
    const libPhp = readFileSync(path.join(process.cwd(), "deploy", "api", "audiobook", "lib.php"), "utf8");
    expect(successPhp).toMatch(/pex_verify_paid_session/);
    expect(libPhp).toMatch(/PEX_AUDIOBOOK_PRICE_CENTS = 1111/);
    expect(libPhp).toMatch(/payment_status/);
  });

  it("fails closed for invalid download tokens", () => {
    const downloadPhp = readFileSync(
      path.join(process.cwd(), "deploy", "api", "audiobook", "download.php"),
      "utf8",
    );
    expect(downloadPhp).toMatch(/403/);
    expect(downloadPhp).toMatch(/pex_verify_download_token/);
  });

  it("defines privacy-safe GA4 audiobook events without payment identifiers", () => {
    const names = Object.values(AUDIOBOOK_GA4_EVENTS);
    expect(names).toEqual([
      "pex_audiobook_offer_viewed",
      "pex_audiobook_sample_start",
      "pex_audiobook_checkout_start",
      "pex_audiobook_purchase_confirmed",
    ]);
    const eventsSource = readFileSync(
      path.join(process.cwd(), "src", "analytics", "audiobookEvents.ts"),
      "utf8",
    );
    expect(eventsSource).not.toMatch(/session_id|customer|email|payment/i);
  });

  it("blocks direct web access to private storage in deploy htaccess", () => {
    const htaccess = readFileSync(path.join(process.cwd(), "deploy", ".htaccess"), "utf8");
    expect(htaccess).toMatch(/private/);
    expect(htaccess).toMatch(/api\/audiobook/);
  });
});
