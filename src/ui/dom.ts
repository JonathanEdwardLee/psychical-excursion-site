export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | boolean | undefined> = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (value === true) {
      node.setAttribute(key, "");
      continue;
    }
    if (key === "class") {
      node.className = value;
      continue;
    }
    node.setAttribute(key, value);
  }
  for (const child of children) {
    node.append(child);
  }
  return node;
}

export function text(value: string): Text {
  return document.createTextNode(value);
}

export function formatWhen(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export function routeParts(hash = window.location.hash): { path: string; parts: string[] } {
  const raw = hash.replace(/^#/, "") || "/";
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  const parts = path.split("/").filter(Boolean);
  return { path, parts };
}

export function go(path: string): void {
  window.location.hash = path.startsWith("#") ? path : `#${path}`;
}

export function announce(message: string): void {
  const live = document.getElementById("live-status");
  if (live) live.textContent = message;
}
