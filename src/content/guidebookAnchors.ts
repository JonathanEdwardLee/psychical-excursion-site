export const NIGHTTIME_BODY_RELEASE_ID = "nighttime-body-release";
export const NIGHTTIME_BODY_RELEASE_HEADING = "A Nighttime Body Release";
export const RELAX_THE_BODY_PEX_ID = "relax-the-body";
export const RELAX_THE_BODY_LABEL = "Relax the body";
export const RELAX_THE_BODY_HREF = `#/feel-the-body#${NIGHTTIME_BODY_RELEASE_ID}`;
export const ATTENTION_INSTRUMENT_TOKEN = "pex:attention-instrument";

const HEADING_IDS: Record<string, string> = {
  [NIGHTTIME_BODY_RELEASE_HEADING]: NIGHTTIME_BODY_RELEASE_ID,
  References: "references",
};

export function guidebookHeadingId(text: string): string | undefined {
  return HEADING_IDS[text];
}

export type PexGuidebookLink = {
  id: string;
  href: string;
  label: string;
};

export const PEX_GUIDEBOOK_LINKS: Record<string, PexGuidebookLink> = {
  [RELAX_THE_BODY_PEX_ID]: {
    id: RELAX_THE_BODY_PEX_ID,
    href: RELAX_THE_BODY_HREF,
    label: RELAX_THE_BODY_LABEL,
  },
};

export type GuidebookHashParts = {
  path: string;
  fragment: string;
};

export function parseGuidebookHash(hash = window.location.hash): GuidebookHashParts {
  const raw = hash.replace(/^#/, "");
  const withoutQuery = raw.split("?")[0] || "/";
  const [pathPart, fragment = ""] = withoutQuery.split("#");
  const normalized = pathPart && pathPart.startsWith("/") ? pathPart : `/${pathPart ?? ""}`;
  return { path: normalized || "/", fragment };
}

export function isFeelTheBodyPath(path: string): boolean {
  return path === "/feel-the-body";
}
