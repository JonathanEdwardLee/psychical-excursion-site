import catalog from "./guidebookCatalog.json";

export const GUIDEBOOK_SITE_ORIGIN = catalog.origin;

export type GuidebookCatalogPage = (typeof catalog.pages)[number];

export const GUIDEBOOK_CATALOG_PAGES: readonly GuidebookCatalogPage[] = catalog.pages;

export const INTRODUCTION_TITLE = catalog.pages[0]!.title;
export const INTRODUCTION_PATH = catalog.pages[0]!.path;
export const INTRODUCTION_DESCRIPTION = catalog.pages[0]!.description;

export function canonicalGuidebookPath(path: string): string {
  if (!path) return INTRODUCTION_PATH;
  const trimmed = path.split("?")[0] || "/";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (withSlash === "/") return INTRODUCTION_PATH;
  return withSlash.endsWith("/") ? withSlash : `${withSlash}/`;
}

export function catalogPageById(id: string): GuidebookCatalogPage | undefined {
  return GUIDEBOOK_CATALOG_PAGES.find((page) => page.id === id);
}

export function catalogPageByPath(path: string): GuidebookCatalogPage | undefined {
  const canonical = canonicalGuidebookPath(path);
  return GUIDEBOOK_CATALOG_PAGES.find((page) => page.path === canonical);
}

export function catalogPageByPublicPage(page: string): GuidebookCatalogPage | undefined {
  return catalogPageById(page === "home" ? "home" : page);
}

export function absoluteCanonicalUrl(path: string): string {
  return `${GUIDEBOOK_SITE_ORIGIN}${canonicalGuidebookPath(path)}`;
}

export function documentTitleForCatalog(title: string): string {
  return `${title} | Psychical Excursion`;
}

function normalizeLegacyHash(hash: string): string {
  const raw = hash.trim();
  if (!raw || raw === "#" || raw === "#/") return "#/";
  return raw;
}

export function resolveLegacyGuidebookHash(hash: string): { path: string; fragment: string } | null {
  if (!hash.startsWith("#/")) return null;
  const raw = hash.replace(/^#/, "");
  if (!raw || raw === "/") return { path: INTRODUCTION_PATH, fragment: "" };
  if (!raw.startsWith("/")) return null;
  const withoutQuery = raw.split("?")[0] || "/";
  const [pathPart, fragment = ""] = withoutQuery.split("#");
  const legacy = normalizeLegacyHash(`#${pathPart || "/"}`);
  const page = GUIDEBOOK_CATALOG_PAGES.find((entry) => entry.legacyHashes.includes(legacy));
  if (!page) return null;
  return { path: page.path, fragment };
}

export function currentGuidebookPathname(pathname = window.location.pathname): string {
  return canonicalGuidebookPath(pathname);
}
