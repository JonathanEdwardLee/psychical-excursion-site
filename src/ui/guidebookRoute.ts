export function normalizeGuidebookPublicHash(): void {
  const hash = window.location.hash.split("?")[0];
  if (!hash || hash === "#" || hash === "#/") return;
  window.history.replaceState(null, "", `#/${window.location.search}`);
}

export function isGuidebookHomeHash(): boolean {
  const hash = window.location.hash.split("?")[0];
  return !hash || hash === "#" || hash === "#/";
}
