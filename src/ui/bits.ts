import { ENTRY_TYPE_LABEL, type EntryType, type JournalEntry, type SyncState } from "../domain/types.ts";
import { el, formatWhen, go, text } from "./dom.ts";

export function syncStateLabel(state: SyncState): string {
  switch (state) {
    case "LOCAL":
      return "Saved on this device";
    case "PENDING_SYNC":
      return "Waiting to back up";
    case "SYNCED":
      return "Backed up to Google Drive";
    case "SYNC_ERROR":
      return "Backup needs attention";
    default:
      return state;
  }
}

export function emptyJournal(): HTMLElement {
  return el("div", { class: "journal-empty" }, [
    el("p", { class: "lede" }, [
      "Your Journal is where saved captures live — dreams, experiences, sensations, and notes.",
    ]),
    el("p", {}, ["Nothing here yet. Tap ", el("a", { href: "#/capture" }, ["Capture"]), " to save your first entry."]),
  ]);
}

export function entryCard(entry: JournalEntry): HTMLElement {
  const metaParts: (HTMLElement | Text)[] = [
    el("span", { class: "type-label" }, [ENTRY_TYPE_LABEL[entry.type]]),
    text(" · "),
    el("time", { datetime: new Date(entry.createdAt).toISOString() }, [formatWhen(entry.createdAt)]),
  ];
  if (entry.audioId) {
    metaParts.push(text(" · "), el("span", { class: "entry-audio-badge" }, ["Recording"]));
  }
  if (entry.syncState !== "LOCAL") {
    metaParts.push(text(" · "), el("span", { class: "entry-sync-badge" }, [syncStateLabel(entry.syncState)]));
  }
  const excerpt = entry.note
    ? entry.note
    : entry.audioId
      ? "Recording saved — open to replay"
      : "Empty note";
  return el("article", { class: "entry-row" }, [
    el("a", { href: `#/journal/${entry.id}`, class: "entry-link" }, [
      el("p", { class: "meta" }, metaParts),
      el("p", {}, [excerpt]),
    ]),
  ]);
}

export function typeFieldset(selected: EntryType | null, onChange: (type: EntryType) => void): HTMLElement {
  const fieldset = el("fieldset", { class: "type-set" }, [el("legend", {}, ["Capture type"])]);
  (Object.keys(ENTRY_TYPE_LABEL) as EntryType[]).forEach((type) => {
    const id = `type-${type}`;
    const label = el("label", { class: "choice", for: id }, [
      el("input", {
        type: "radio",
        name: "capture-type",
        id,
        value: type,
        ...(selected === type ? { checked: true } : {}),
      }),
      text(ENTRY_TYPE_LABEL[type]),
    ]);
    const input = label.querySelector("input")!;
    input.addEventListener("change", () => onChange(type));
    fieldset.append(label);
  });
  return fieldset;
}

export function statusBox(kind: "info" | "error" | "ok", title: string, body: string): HTMLElement {
  return el("div", { class: `status status-${kind}`, role: kind === "error" ? "alert" : "status" }, [
    el("p", { class: "status-title" }, [title]),
    el("p", {}, [body]),
  ]);
}

export function confirmBar(
  question: string,
  confirmLabel: string,
  onConfirm: () => void,
  onCancel: () => void,
): HTMLElement {
  const bar = el("div", { class: "confirm", role: "group", "aria-label": "Confirm deletion" }, [
    el("p", {}, [question]),
  ]);
  const yes = el("button", { type: "button", class: "danger" }, [confirmLabel]);
  const no = el("button", { type: "button" }, ["Keep entry"]);
  yes.addEventListener("click", onConfirm);
  no.addEventListener("click", onCancel);
  bar.append(yes, no);
  return bar;
}

export function primaryButton(label: string, onClick: () => void, opts: { id?: string; disabled?: boolean } = {}): HTMLButtonElement {
  const button = el("button", { type: "button", class: "primary", ...(opts.id ? { id: opts.id } : {}) }, [label]);
  if (opts.disabled) button.disabled = true;
  button.addEventListener("click", onClick);
  return button;
}

export function navLink(href: string, label: string, current: boolean): HTMLAnchorElement {
  return el("a", { href, ...(current ? { "aria-current": "page" } : {}) }, [label]);
}

export function backTo(path: string, label: string): HTMLAnchorElement {
  const link = el("a", { href: `#${path}`, class: "text-link" }, [label]);
  link.addEventListener("click", (event) => {
    event.preventDefault();
    go(path);
  });
  return link;
}
