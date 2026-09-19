import { DRIVE_FILE_SCOPE } from "../../domain/sync.ts";
import { isGoogleSyncConfigured } from "../../sync/config.ts";
import {
  disconnectDrive,
  getConnectionSnapshot,
  retryPendingSync,
} from "../../sync/syncEngine.ts";
import { localStore } from "../../db/store.ts";
import { statusBox } from "../bits.ts";
import { announce, el } from "../dom.ts";

export async function renderAccountPage(main: HTMLElement): Promise<void> {
  const connectionHost = el("div", { id: "account-connection" });
  const syncHost = el("div", { id: "account-sync" });

  const paint = async () => {
    const connection = await getConnectionSnapshot();
    const entries = await localStore.listEntries();
    const pending = entries.filter((e) => e.syncState === "PENDING_SYNC" || e.syncState === "SYNC_ERROR").length;
    const configured = isGoogleSyncConfigured();

    connectionHost.replaceChildren(
      el("h3", {}, ["Google account"]),
      el("p", {}, [
        "Your Google account is identity only in this architecture. It does not replace local capture or IndexedDB storage on this device.",
      ]),
      statusBox(
        configured ? "info" : "info",
        configured ? "Sign-in not active in this build" : "Google sign-in not configured",
        configured
          ? "OAuth client configuration is required before Google identity can appear here. Local journal use is unchanged."
          : "This deployment has no Google OAuth client ID. The app remains fully useful in local-only mode.",
      ),
      el("h3", {}, ["Connect Google Drive"]),
      el("p", {}, [
        "Drive connection uses the narrow ",
        el("code", {}, ["drive.file"]),
        " scope so PEx can write user-owned journal files you choose — not your entire Drive.",
      ]),
      statusBox(
        connection.driveAuthorized ? "ok" : "info",
        connection.driveAuthorized ? "Drive prepared" : "Drive not connected",
        `${connection.message} Scope: ${DRIVE_FILE_SCOPE}.`,
      ),
      el("p", { class: "meta" }, [
        connection.googleAccountLabel ? `Account label: ${connection.googleAccountLabel}` : "No Google account linked on this device.",
      ]),
    );

    syncHost.replaceChildren(
      el("h3", {}, ["Journal sync"]),
      el("p", {}, [
        "Recordings and notes are written to IndexedDB first. Sync runs only after local-safe confirmation and never removes local entries on failure.",
      ]),
      el("p", { class: "meta" }, [`${pending} entr${pending === 1 ? "y" : "ies"} pending or retrying sync on this device.`]),
    );
  };

  await paint();

  const retryBtn = el("button", { type: "button", class: "primary", id: "retry-sync-btn" }, ["Retry pending sync"]);
  retryBtn.addEventListener("click", () => {
    void (async () => {
      const count = await retryPendingSync();
      await paint();
      announce(count ? `${count} entries synced` : "Retry finished");
    })();
  });

  const disconnectBtn = el("button", { type: "button", id: "disconnect-drive-btn" }, ["Disconnect Drive"]);
  disconnectBtn.addEventListener("click", () => {
    void (async () => {
      await disconnectDrive();
      await paint();
      announce("Drive disconnected. Local journal unchanged.");
    })();
  });

  const connectBtn = el("button", { type: "button", disabled: true }, ["Connect Google Drive"]);
  connectBtn.title = isGoogleSyncConfigured()
    ? "Authorization UI activates when founder OAuth is configured for production."
    : "Google OAuth is not configured for this deployment.";

  main.append(
    el("section", { class: "stack editorial-page account-surface" }, [
      el("p", { class: "eyebrow" }, ["Optional cloud"]),
      el("h2", { class: "display-title" }, ["Account & storage"]),
      el("p", { class: "lede" }, [
        "Local journal and progress stay on this device first. Google account and Google Drive are separate, optional layers for a future connected pass.",
      ]),
      connectionHost,
      el("div", { class: "actions" }, [connectBtn, disconnectBtn, retryBtn]),
      syncHost,
      el("p", {}, [el("a", { href: "#/data" }, ["Data export and persistence on this device"])]),
    ]),
  );
}
