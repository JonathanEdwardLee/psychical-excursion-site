import { isGoogleSyncConfigured } from "../sync/config.ts";
import { signInGoogleAccount } from "../sync/syncEngine.ts";
import { signedOutJournalInvite, statusBox } from "./bits.ts";
import { el } from "./dom.ts";

export function wireSignInInvite(container: HTMLElement, onSignedIn?: () => void): void {
  const existing = container.querySelector("#journal-sign-in-btn");
  if (!existing || existing.getAttribute("data-sign-in-wired") === "1") return;
  existing.setAttribute("data-sign-in-wired", "1");
  existing.addEventListener("click", () => {
    void (async () => {
      if (!isGoogleSyncConfigured()) return;
      try {
        await signInGoogleAccount();
        onSignedIn?.();
      } catch {
        container.append(
          statusBox("error", "Sign-in did not finish", "You can keep reading the guide without signing in."),
        );
      }
    })();
  });
}

export function signedOutPersonalToolsGate(options: {
  title: string;
  lede: string;
  onSignedIn?: () => void;
}): HTMLElement {
  const statusHost = el("div");
  const invite = signedOutJournalInvite(options.lede);
  invite.querySelector("#journal-sign-in-btn")?.addEventListener("click", () => {
    void (async () => {
      if (!isGoogleSyncConfigured()) {
        statusHost.replaceChildren(
          statusBox("info", "Sign-in not available", "This copy of the site does not offer Google sign-in."),
        );
        return;
      }
      try {
        await signInGoogleAccount();
        options.onSignedIn?.();
      } catch {
        statusHost.replaceChildren(
          statusBox("error", "Sign-in did not finish", "You can keep reading the guide without signing in."),
        );
      }
    })();
  });
  return el("section", { class: "personal-tools-gate editorial-page" }, [
    el("p", { class: "eyebrow" }, ["Sign in"]),
    el("h2", { class: "display-title" }, [options.title]),
    invite,
    statusHost,
  ]);
}
