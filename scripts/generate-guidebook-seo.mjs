#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import catalog from "../src/content/guidebookCatalog.json" with { type: "json" };

const origin = catalog.origin;
const pages = catalog.pages;

export function sitemapXml() {
  const urls = pages
    .map((page) => `  <url>\n    <loc>${origin}${page.path}</loc>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;
}

function applyHead(html, page) {
  const title = `${page.title} | Psychical Excursion`;
  const canonical = `${origin}${page.path}`;
  let next = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  next = next.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
  );
  if (!next.includes('rel="canonical"')) {
    next = next.replace(
      "</title>",
      `</title>\n    <link rel="canonical" href="${canonical}" />\n    <meta name="robots" content="index,follow" />`,
    );
  } else {
    next = next.replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`);
  }
  return next;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function writeGuidebookSeoFiles(outDir) {
  const template = readFileSync(path.join(outDir, "index.html"), "utf8");
  for (const page of pages) {
    const dir = path.join(outDir, page.path.replace(/^\/|\/$/g, ""));
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "index.html"), applyHead(template, page));
  }
  writeFileSync(path.join(outDir, "sitemap.xml"), sitemapXml());
  writeFileSync(path.join(outDir, "robots.txt"), robotsTxt());
}

const direct = process.argv[1] && path.basename(process.argv[1]) === "generate-guidebook-seo.mjs";
if (direct && process.argv[2]) {
  writeGuidebookSeoFiles(process.argv[2]);
}
