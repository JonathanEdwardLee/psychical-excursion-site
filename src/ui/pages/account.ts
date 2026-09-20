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
      el("h3", {}, ["Google account (optional)"]),
      el("p", {}, [
        "Signing in identifies you to Google. It does not upload your Journal by itself. Your entries stay on this device until you connect Drive.",
      ]),
      statusBox(
        connection.googleSignedIn ? "ok" : "info",
        connection.googleSignedIn ? "Signed in with Google" : configured ? "Not signed in" : "Backup not set up on this site",
        connection.googleSignedIn
          ? `${connection.googleAccountLabel ?? "Google account"} on this device. Sign out anytime — your Journal stays here.`
          : configured
            ? "Optional. Sign in only if you want Google-connected backup."
            : "This copy of the site works fully without Google. Backup is not configured on this host.",
      ),
      el("h3", {}, ["Google Drive backup (optional)"]),
      el("p", {}, [
        "Separate from sign-in. When connected, the app can copy Dream Journal files you save into a folder on your Google Drive — not your entire Drive.",
      ]),
      el("details", { class: "account-permission-details" }, [
        el("summary", {}, ["What permission is requested?"]),
        el("p", { class: "meta" }, [
          "Google Drive access limited to files this app creates or updates for your Dream Journal backup.",
        ]),
      ]),
      statusBox(
        connection.driveAuthorized ? "ok" : "info",
        headline,
        connection.message,
      ),
      el("p", { class: "meta" }, [
        connection.pendingSyncCount
          ? `${connection.pendingSyncCount} ${connection.pendingSyncCount === 1 ? "entry" : "entries"} waiting to back up (safe on this device).`
          : "Nothing waiting to back up.",
      ]),
    );

    syncHost.replaceChildren(
      el("h3", {}, ["How backup works"]),
      el("p", {}, [
        "Dream Journal saves to this device first. If Drive is connected, entries copy up when possible. If backup fails, nothing is deleted from your Journal here.",
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
        statusHost.replaceChildren(statusBox("ok", "Signed in", "Your Journal is still on this device until Drive is connected."));
        await paint();
      } catch {
        statusHost.replaceChildren(statusBox("error", "Sign-in failed", "Your Journal on this device is unchanged."));
      }
    })();
  });

  const signOutBtn = el("button", { type: "button", id: "google-sign-out-btn" }, ["Sign out of Google"]);
  signOutBtn.addEventListener("click", () => {
    void (async () => {
      await signOutGoogleAccount();
      await paint();
      announce("Signed out. Journal on this device unchanged.");
    })();
  });

  const connectBtn = el("button", { type: "button", class: "primary", id: "connect-drive-btn" }, [
    "Connect Google Drive for backup",
  ]);
  connectBtn.disabled = !isGoogleSyncConfigured();
  connectBtn.addEventListener("click", () => {
    void (async () => {
      try {
        await connectDriveForSync();
        statusHost.replaceChildren(
          statusBox("ok", "Drive connected", "Backup will run when possible. Your Journal was not deleted."),
        );
        await paint();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Connection failed";
        statusHost.replaceChildren(
          statusBox("error", "Drive not connected", `${message}. Your Journal on this device is unchanged.`),
        );
      }
    })();
  });

  const disconnectBtn = el("button", { type: "button", id: "disconnect-drive-btn" }, ["Disconnect Google Drive"]);
  disconnectBtn.addEventListener("click", () => {
    void (async () => {
      await disconnectDrive();
      await paint();
      announce("Drive disconnected. Journal on this device unchanged.");
    })();
  });

  const retryBtn = el("button", { type: "button", id: "retry-sync-btn" }, ["Retry backup"]);
  retryBtn.addEventListener("click", () => {
    void (async () => {
      const count = await retryPendingSync();
      await paint();
      announce(count ? `${count} entries backed up` : "Retry finished");
    })();
  });

  const reconcileBtn = el("button", { type: "button", id: "reconcile-drive-btn" }, ["Check Drive for journal files"]);
  reconcileBtn.addEventListener("click", () => {
    void (async () => {
      try {
        const summary = await reconcileFromDrive();
        statusHost.replaceChildren(
          statusBox(
            "ok",
            "Drive check finished",
            `Added ${summary.imported} from Drive, skipped ${summary.skipped}. Your device copy was not replaced without your action.`,
          ),
        );
        await paint();
      } catch {
        statusHost.replaceChildren(statusBox("error", "Drive check failed", "Your Journal on this device is unchanged."));
      }
    })();
  });

  main.append(
    el("section", { class: "stack editorial-page account-surface" }, [
      el("p", { class: "eyebrow" }, ["Optional backup"]),
      el("h2", { class: "display-title" }, ["Dream Journal backup"]),
      el("p", { class: "lede" }, [
        "The guide works without Google. Sign in and connect Drive only if you want Dream Journal backup in your Google account.",
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
      el("p", {}, [el("a", { href: "#/data" }, ["Export and storage on this device"])]),
    ]),
  );
}
