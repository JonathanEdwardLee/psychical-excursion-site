import { DRIVE_FILE_SCOPE } from "../../domain/sync.ts";
import { isGoogleSyncConfigured } from "../../sync/config.ts";
import {
  connectDriveForSync,
  disconnectDrive,
  getConnectionSnapshot,
  reconcileFromDrive,
  retryPendingSync,
  signInGoogleAccount,
  signOutGoogleAccount,
} from "../../sync/syncEngine.ts";
import { connectionHeadline } from "../../sync/connectionLabels.ts";
import { statusBox } from "../bits.ts";
import { announce, el } from "../dom.ts";

export async function renderAccountPage(main: HTMLElement): Promise<void> {
  const connectionHost = el("div", { id: "account-connection" });
  const syncHost = el("div", { id: "account-sync" });
  const statusHost = el("div", { id: "account-status" });

  const paint = async () => {
    const connection = await getConnectionSnapshot();
    const configured = isGoogleSyncConfigured();
    const headline = connectionHeadline(connection.kind);

    connectionHost.replaceChildren(
      el("h3", {}, ["Google account"]),
      el("p", {}, [
        "Identity only — signing in does not upload your journal. Local IndexedDB remains authoritative for capture safety.",
      ]),
      statusBox(
        connection.googleSignedIn ? "ok" : "info",
        connection.googleSignedIn ? "Signed in" : configured ? "Local only" : "Not configured",
        connection.googleSignedIn
          ? `${connection.googleAccountLabel ?? "Google account"} on this device. Sign out anytime; local journal stays.`
          : configured
            ? "Optional. Sign in when you want Google-connected features."
            : "No OAuth client ID in this deployment. PEx is fully usable without Google.",
      ),
      el("h3", {}, ["Connect Google Drive"]),
      el("p", {}, [
        "Separate from sign-in. Uses ",
        el("code", {}, ["drive.file"]),
        " so PEx can create/update journal files it owns — not read your entire Drive.",
      ]),
      statusBox(
        connection.driveAuthorized ? "ok" : "info",
        headline,
        `${connection.message} Scope: ${DRIVE_FILE_SCOPE}.`,
      ),
      el("p", { class: "meta" }, [
        connection.pendingSyncCount
          ? `${connection.pendingSyncCount} pending sync (local copies safe).`
          : "No pending sync items.",
      ]),
    );

    syncHost.replaceChildren(
      el("h3", {}, ["Journal sync"]),
      el("p", {}, [
        "Record → IndexedDB local-safe → optional Drive upload. Failures never delete local entries. Retry is idempotent.",
      ]),
    );
  };

  await paint();

  const signInBtn = el("button", { type: "button", class: "primary", id: "google-sign-in-btn" }, ["Sign in with Google"]);
  signInBtn.disabled = !isGoogleSyncConfigured();
  signInBtn.addEventListener("click", () => {
    void (async () => {
      try {
        await signInGoogleAccount();
        statusHost.replaceChildren(statusBox("ok", "Signed in", "Journal remains local until Drive is connected."));
        await paint();
      } catch {
        statusHost.replaceChildren(statusBox("error", "Sign-in failed", "Local journal is unchanged."));
      }
    })();
  });

  const signOutBtn = el("button", { type: "button", id: "google-sign-out-btn" }, ["Sign out"]);
  signOutBtn.addEventListener("click", () => {
    void (async () => {
      await signOutGoogleAccount();
      await paint();
      announce("Signed out. Local journal unchanged.");
    })();
  });

  const connectBtn = el("button", { type: "button", class: "primary", id: "connect-drive-btn" }, ["Connect Google Drive"]);
  connectBtn.disabled = !isGoogleSyncConfigured();
  connectBtn.addEventListener("click", () => {
    void (async () => {
      try {
        await connectDriveForSync();
        statusHost.replaceChildren(
          statusBox("ok", "Drive connected", "Pending items will sync when authorized. Local journal was not deleted."),
        );
        await paint();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Connection failed";
        statusHost.replaceChildren(
          statusBox("error", "Drive not connected", `${message}. Local journal is unchanged.`),
        );
      }
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

  const retryBtn = el("button", { type: "button", id: "retry-sync-btn" }, ["Retry pending sync"]);
  retryBtn.addEventListener("click", () => {
    void (async () => {
      const count = await retryPendingSync();
      await paint();
      announce(count ? `${count} entries synced` : "Retry finished");
    })();
  });

  const reconcileBtn = el("button", { type: "button", id: "reconcile-drive-btn" }, ["Reconcile from Drive"]);
  reconcileBtn.addEventListener("click", () => {
    void (async () => {
      try {
        const summary = await reconcileFromDrive();
        statusHost.replaceChildren(
          statusBox(
            "ok",
            "Reconciliation finished",
            `Imported ${summary.imported}, skipped ${summary.skipped}, conflicts ${summary.conflicts}. Local copies were not silently overwritten.`,
          ),
        );
        await paint();
      } catch {
        statusHost.replaceChildren(statusBox("error", "Reconciliation failed", "Local journal is unchanged."));
      }
    })();
  });

  main.append(
    el("section", { class: "stack editorial-page account-surface" }, [
      el("p", { class: "eyebrow" }, ["Optional cloud"]),
      el("h2", { class: "display-title" }, ["Account & storage"]),
      el("p", { class: "lede" }, [
        "Local-first always. Google account and Google Drive are separate optional layers. No cloud backup is implied until sync succeeds.",
      ]),
      statusHost,
      connectionHost,
      el("div", { class: "actions account-actions" }, [
        signInBtn,
        signOutBtn,
        connectBtn,
        disconnectBtn,
        retryBtn,
        reconcileBtn,
      ]),
      syncHost,
      el("p", {}, [el("a", { href: "#/data" }, ["Data export and persistence on this device"])]),
    ]),
  );
}
