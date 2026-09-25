import { readPublicGuidebookPathname } from "../ui/guidebookRoute.ts";

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
  return readPublicGuidebookPathname();
}

export function resetGa4PublicPageViews(): void {
  lastPublicPath = null;
}

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
