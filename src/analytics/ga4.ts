export const GA4_MEASUREMENT_ID = "G-297PE2TV2R";

type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFn;
  }
}

let lastPublicPath: string | null = null;

function publicPagePath(): string {
  const raw = window.location.hash.replace(/^#/, "");
  const withoutQuery = raw.split("?")[0] || "/";
  const pathPart = withoutQuery.split("#")[0] || "/";
  const normalized = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;
  return `${window.location.pathname}${window.location.search}#${normalized}`;
}

/** Reset duplicate-suppression between tests. */
export function resetGa4PublicPageViews(): void {
  lastPublicPath = null;
}

/**
 * Record one aggregate page view for the current public guidebook route.
 * Uses the hash path without in-page fragments so citations and section
 * deep links do not double-count the same chapter.
 */
export function trackPublicGuidebookPageView(): void {
  const path = publicPagePath();
  if (path === lastPublicPath) return;
  lastPublicPath = path;
  const gtag = window.gtag;
  if (typeof gtag !== "function") return;
  gtag("event", "page_view", {
    page_title: document.title,
    page_location: `${window.location.origin}${path}`,
    page_path: path,
  });
}
