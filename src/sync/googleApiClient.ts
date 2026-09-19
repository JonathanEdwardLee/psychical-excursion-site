/**
 * Sole network egress for optional Google sync (Drive + identity userinfo).
 * Journal content is sent only in request bodies to googleapis.com, never in URLs or logs.
 */

const ALLOWED_HOSTS = new Set(["www.googleapis.com", "openidconnect.googleapis.com"]);

let fetchOverride: typeof fetch | null = null;

export function setGoogleApiFetchForTests(override: typeof fetch | null): void {
  fetchOverride = override;
}

export async function googleApiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const url = new URL(input);
  if (!ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error("google-api-host-not-allowed");
  }
  const fn = fetchOverride ?? globalThis.fetch.bind(globalThis);
  return fn(url.toString(), init);
}

export type DriveFile = {
  id: string;
  name: string;
  mimeType?: string;
  appProperties?: Record<string, string>;
};

export async function driveListChildren(accessToken: string, folderId: string, queryExtra = ""): Promise<DriveFile[]> {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false${queryExtra}`);
  const response = await googleApiFetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,appProperties)&pageSize=200&spaces=drive`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (response.status === 401) throw new Error("auth-expired");
  if (!response.ok) throw new Error("drive-list-failed");
  const data = (await response.json()) as { files?: DriveFile[] };
  return data.files ?? [];
}

export async function driveFindByName(
  accessToken: string,
  parentId: string,
  name: string,
  mimeType = "application/vnd.google-apps.folder",
): Promise<DriveFile | null> {
  const files = await driveListChildren(
    accessToken,
    parentId,
    ` and name='${name.replace(/'/g, "\\'")}' and mimeType='${mimeType}'`,
  );
  return files[0] ?? null;
}

export async function driveCreateFolder(accessToken: string, name: string, parentId?: string): Promise<DriveFile> {
  const metadata: Record<string, unknown> = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) metadata.parents = [parentId];
  const response = await googleApiFetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });
  if (response.status === 401) throw new Error("auth-expired");
  if (!response.ok) throw new Error("drive-create-folder-failed");
  return (await response.json()) as DriveFile;
}

export async function driveUploadMultipart(
  accessToken: string,
  options: {
    name: string;
    mimeType: string;
    content: Blob | string;
    parentId: string;
    existingFileId?: string | null;
    appProperties?: Record<string, string>;
  },
): Promise<DriveFile> {
  const metadata: Record<string, unknown> = {
    name: options.name,
    mimeType: options.mimeType,
    parents: options.existingFileId ? undefined : [options.parentId],
    appProperties: options.appProperties,
  };
  const bodyContent =
    typeof options.content === "string" ? new Blob([options.content], { type: options.mimeType }) : options.content;
  const boundary = `pex-${Date.now().toString(36)}`;
  const metaPart = JSON.stringify(metadata);
  const multipart = new Blob(
    [
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metaPart}\r\n`,
      `--${boundary}\r\nContent-Type: ${options.mimeType}\r\n\r\n`,
      bodyContent,
      `\r\n--${boundary}--`,
    ],
    { type: `multipart/related; boundary=${boundary}` },
  );

  const url = options.existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${options.existingFileId}?uploadType=multipart`
    : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

  const response = await googleApiFetch(url, {
    method: options.existingFileId ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: multipart,
  });
  if (response.status === 401) throw new Error("auth-expired");
  if (!response.ok) throw new Error("drive-upload-failed");
  return (await response.json()) as DriveFile;
}

export async function driveDownloadFile(accessToken: string, fileId: string): Promise<ArrayBuffer> {
  const response = await googleApiFetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status === 401) throw new Error("auth-expired");
  if (!response.ok) throw new Error("drive-download-failed");
  return response.arrayBuffer();
}

export async function ensurePexJournalFolder(accessToken: string, year: number): Promise<string> {
  const root = await ensureFolderPath(accessToken, ["Psychical Excursion", "Journal", String(year)]);
  return root;
}

/** Lists existing Journal year folders only — does not create empty historical folders. */
export async function listPexJournalYearFolders(
  accessToken: string,
): Promise<Array<{ year: number; folderId: string }>> {
  const pexRoot = await driveFindByName(accessToken, "root", "Psychical Excursion");
  if (!pexRoot) return [];
  const journalRoot = await driveFindByName(accessToken, pexRoot.id, "Journal");
  if (!journalRoot) return [];
  const children = await driveListChildren(accessToken, journalRoot.id);
  return children
    .filter(
      (file) =>
        file.mimeType === "application/vnd.google-apps.folder" && /^\d{4}$/.test(file.name),
    )
    .map((file) => ({ year: Number(file.name), folderId: file.id }))
    .filter((row) => row.year >= 1970 && row.year <= 9999)
    .sort((a, b) => a.year - b.year);
}

async function ensureFolderPath(accessToken: string, segments: string[]): Promise<string> {
  let parent: string | undefined;
  for (const segment of segments) {
    const parentId = parent ?? "root";
    const existing = await driveFindByName(accessToken, parentId, segment);
    if (existing) {
      parent = existing.id;
      continue;
    }
    const created = await driveCreateFolder(accessToken, segment, parent);
    parent = created.id;
  }
  return parent!;
}
