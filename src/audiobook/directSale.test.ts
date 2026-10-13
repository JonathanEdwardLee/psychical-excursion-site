import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  AUDIOBOOK_BUYER_SUPPORT_LINES,
  AUDIOBOOK_CHECKOUT_PATH,
  AUDIOBOOK_PRICE_CENTS,
  AUDIOBOOK_PRICE_USD,
  AUDIOBOOK_SAMPLE_MP3_PATH,
} from "../content/audiobookDirectSale.ts";
import { AUDIOBOOK_GA4_EVENTS } from "../analytics/audiobookEvents.ts";
import { renderGuidebookAudiobook } from "../ui/pages/guidebookAudiobook.ts";
import { el } from "../ui/dom.ts";

const STOREFRONT_SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

function walkStorefrontSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkStorefrontSourceFiles(full));
    else if (
      STOREFRONT_SOURCE_EXTENSIONS.has(path.extname(entry.name))
      && !entry.name.endsWith(".test.ts")
      && !entry.name.endsWith(".test.tsx")
    ) {
      out.push(full);
    }
  }
  return out;
}

function readDeployPhp(name: string): string {
  return readFileSync(path.join(process.cwd(), "deploy", "api", "audiobook", name), "utf8");
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

  it("scans storefront TypeScript source for forbidden Stripe secret exposure", () => {
    const srcDir = path.join(process.cwd(), "src");
    const files = walkStorefrontSourceFiles(srcDir);
    expect(files.length).toBeGreaterThan(10);
    const blob = files.map((file) => readFileSync(file, "utf8")).join("\n");
    expect(blob).not.toMatch(/sk_live_/);
    expect(blob).not.toMatch(/sk_test_/);
    expect(blob).not.toContain("stripe_secret_key");
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

  it("verifies Stripe session against configured price id and quantity on the server", () => {
    const libPhp = readDeployPhp("lib.php");
    expect(libPhp).toMatch(/stripe_price_id/);
    expect(libPhp).toMatch(/expand\[\]=line_items\.data\.price/);
    expect(libPhp).toMatch(/quantity === 1/);
    expect(libPhp).toMatch(/hash_equals\(\$expectedPriceId, \$priceId\)/);
    const checkoutPhp = readDeployPhp("checkout.php");
    expect(checkoutPhp).toMatch(/stripe_price_id/);
    expect(checkoutPhp).toMatch(/line_items\[0\]\[quantity\].*1/);
  });

  it("fails closed for invalid download tokens", () => {
    const downloadPhp = readDeployPhp("download.php");
    expect(downloadPhp).toMatch(/403/);
    expect(downloadPhp).toMatch(/pex_verify_download_token/);
  });

  it("fires purchase-confirmed analytics only once per verified grant", () => {
    const libPhp = readDeployPhp("lib.php");
    const successPhp = readDeployPhp("success.php");
    expect(libPhp).toMatch(/purchase_analytics_recorded/);
    expect(libPhp).toMatch(/emit_purchase_analytics/);
    expect(successPhp).toMatch(/emitPurchaseAnalytics/);
    expect(successPhp).toMatch(/if \(\$emitPurchaseAnalytics\)/);
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

  it("omits unverified support email and refund placeholder from buyer-facing copy", () => {
    const storefrontBlob = [
      readFileSync(path.join(process.cwd(), "src", "content", "audiobookDirectSale.ts"), "utf8"),
      readDeployPhp("success.php"),
      readDeployPhp("checkout.php"),
      readDeployPhp("download.php"),
    ].join("\n");
    expect(storefrontBlob).not.toMatch(/support@psychicalexcursion\.com/);
    expect(AUDIOBOOK_BUYER_SUPPORT_LINES.join(" ")).not.toMatch(/Refund policy: contact/);
  });

  it("blocks direct web access to private storage and allows audiobook PHP via nested htaccess", () => {
    const htaccess = readFileSync(path.join(process.cwd(), "deploy", ".htaccess"), "utf8");
    expect(htaccess).toMatch(/private/);
    expect(htaccess).not.toMatch(/DirectoryMatch/);
    expect(htaccess).toMatch(/Require all denied/);
    const apiHtaccess = readFileSync(
      path.join(process.cwd(), "deploy", "api", "audiobook", ".htaccess"),
      "utf8",
    );
    expect(apiHtaccess).toMatch(/Require all granted/);
  });

  it("bypasses paid audiobook API paths in the generated service worker", () => {
    const viteConfig = readFileSync(path.join(process.cwd(), "vite.config.ts"), "utf8");
    expect(viteConfig).toMatch(/url\.pathname\.startsWith\("\/api\/audiobook\/"\)/);
    expect(viteConfig).toMatch(/return;/);
  });
});
