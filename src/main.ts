import "./styles.css";
import { localStore } from "./db/store.ts";
import { registerServiceWorker } from "./pwa/register.ts";
import { inspectAndRequestPersistence } from "./storage/persistence.ts";
import { applyTheme } from "./theme.ts";
import { applyGuidebookLocation } from "./ui/guidebookRoute.ts";
import { renderApp } from "./ui/app.ts";

function root(): HTMLElement {
  const node = document.getElementById("app");
  if (!node) throw new Error("Missing #app");
  return node;
}

async function boot(): Promise<void> {
  applyTheme();
  registerServiceWorker();
  const app = root();
  const draw = () => {
    void renderApp(app);
  };
  if (applyGuidebookLocation()) return;
  window.addEventListener("popstate", draw);
  window.addEventListener("hashchange", () => {
    if (window.location.hash.startsWith("#/")) draw();
  });
  draw();
  try {
    await localStore.open();
    await inspectAndRequestPersistence();
  } catch {
    // IndexedDB/persistence failures are shown in-route; never claim they succeeded.
  }
}

void boot();
