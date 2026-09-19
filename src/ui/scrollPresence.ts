const cleanups: Array<() => void> = [];

export function stopScrollPresence(): void {
  while (cleanups.length) cleanups.pop()?.();
}

function onFrame(fn: () => void): () => void {
  let token = 0;
  const schedule = () => {
    if (token) return;
    token = window.requestAnimationFrame(() => {
      token = 0;
      fn();
    });
  };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  schedule();
  return () => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    if (token) window.cancelAnimationFrame(token);
  };
}

function closestInView(elements: HTMLElement[], bandTop = 0.22, bandBottom = 0.72): HTMLElement | null {
  const top = window.innerHeight * bandTop;
  const bottom = window.innerHeight * bandBottom;
  const mid = window.innerHeight * ((bandTop + bandBottom) / 2);
  let best: HTMLElement | null = null;
  let bestDist = Infinity;
  for (const node of elements) {
    const rect = node.getBoundingClientRect();
    if (rect.bottom < top || rect.top > bottom) continue;
    const dist = Math.abs(rect.top - mid);
    if (dist < bestDist) {
      best = node;
      bestDist = dist;
    }
  }
  return best;
}

function observeIfPossible(targets: Element[], callback: IntersectionObserverCallback): () => void {
  if (typeof IntersectionObserver !== "function" || targets.length === 0) return () => undefined;
  const observer = new IntersectionObserver(callback, {
    root: null,
    threshold: [0, 0.15, 0.4, 0.7, 1],
    rootMargin: "-18% 0px -38% 0px",
  });
  for (const target of targets) observer.observe(target);
  return () => observer.disconnect();
}

export function bindPhaseJourney(root: HTMLElement): void {
  const chapters = [...root.querySelectorAll<HTMLElement>(".phase-chapter")];
  const live = root.querySelector<HTMLElement>("#journey-live");
  if (chapters.length === 0) return;

  let current: HTMLElement | null = null;
  const paint = () => {
    const next = closestInView(chapters, 0.12, 0.82) ?? current ?? chapters[0] ?? null;
    if (!next) return;
    current = next;
    for (const chapter of chapters) {
      const active = chapter === next;
      chapter.classList.toggle("is-active", active);
    }
    const weekId = next.id.replace(/^week-/, "");
    for (const link of root.querySelectorAll<HTMLAnchorElement>(".phase-nav-link, .week-nav-link")) {
      const href = link.getAttribute("href") ?? "";
      link.classList.toggle("is-scroll-current", href === `#/week/${weekId}`);
    }
    if (live) {
      const name = next.querySelector("h3")?.textContent?.trim() ?? "";
      live.textContent = name;
      live.hidden = false;
    }
  };

  cleanups.push(onFrame(paint));
  cleanups.push(observeIfPossible(chapters, () => paint()));
}

export function bindDayReading(root: HTMLElement): void {
  const column = root.querySelector<HTMLElement>(".day-read");
  const meter = root.querySelector<HTMLElement>(".read-progress");
  const place = root.querySelector<HTMLElement>("#read-place");
  const sections = [...root.querySelectorAll<HTMLElement>(".day-section")];
  if (!column || !meter) return;

  const paint = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / max));
    meter.style.setProperty("--read", String(progress));
    meter.dataset.read = `${Math.round(progress * 100)}`;
    const active = closestInView(sections, 0.18, 0.62);
    for (const section of sections) {
      const on = section === active;
      section.classList.toggle("is-current", on);
      const heading = section.querySelector("h3")?.textContent?.trim() ?? "";
      const tick = [...meter.querySelectorAll<HTMLElement>(".read-tick")].find(
        (node) => node.dataset.section === heading,
      );
      tick?.classList.toggle("is-current", on);
    }
    if (place) {
      const heading = active?.querySelector("h3")?.textContent?.trim();
      place.textContent = heading ? heading : progress >= 0.96 ? "End" : "Start";
    }
  };

  cleanups.push(onFrame(paint));
  cleanups.push(observeIfPossible(sections, () => paint()));
}
