export function normalizeGuidebookPublicHash(): void {
  const hash = window.location.hash.split("?")[0];
  if (!hash || hash === "#" || hash === "#/") return;
  const url = `${window.location.pathname}${window.location.search}#/`;
  window.history.replaceState(null, "", url);
}

export function isGuidebookHomeHash(): boolean {
  const hash = window.location.hash.split("?")[0];
  return !hash || hash === "#" || hash === "#/";
}
