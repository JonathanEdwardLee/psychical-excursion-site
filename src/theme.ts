export type ThemeMode = "light" | "bedtime";

const STORAGE_KEY = "pex-theme";

export function readTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "bedtime" || stored === "light") return stored;
  } catch {
    // private mode may block localStorage
  }
  return "light";
}

export function applyTheme(mode: ThemeMode = readTheme()): ThemeMode {
  const root = document.documentElement;
  root.dataset.theme = mode;
  const themeColor = mode === "bedtime" ? "#16120e" : "#f4ead8";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", themeColor);
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // still apply in-memory
  }
  return mode;
}

export function toggleTheme(): ThemeMode {
  const next: ThemeMode = readTheme() === "bedtime" ? "light" : "bedtime";
  return applyTheme(next);
}
