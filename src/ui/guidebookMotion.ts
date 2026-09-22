const cleanups: Array<() => void> = [];

export function stopGuidebookMotion(): void {
  while (cleanups.length) cleanups.pop()?.();
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** One-shot section reveals. Settled text stays still. */
export function bindGuidebookReveals(root: HTMLElement): void {
  stopGuidebookMotion();
  const nodes = [...root.querySelectorAll<HTMLElement>(".pex-reveal")];
  if (nodes.length === 0) return;
  if (prefersReducedMotion() || typeof IntersectionObserver !== "function") {
    for (const node of nodes) node.classList.add("is-visible");
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
  );

  for (const node of nodes) observer.observe(node);
  cleanups.push(() => observer.disconnect());
}
