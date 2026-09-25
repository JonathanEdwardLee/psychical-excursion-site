import { GUIDEBOOK_CATALOG_PAGES } from "./guidebookCatalog.ts";
import { loadGuidebookManuscript } from "./guidebookManuscript.ts";

export type GuidebookBookChapter = {
  number: string;
  title: string;
  path: string;
  id: string;
};

export function guidebookBookChapters(): GuidebookBookChapter[] {
  return GUIDEBOOK_CATALOG_PAGES.filter((page) => page.id !== "landing").map((page, index) => ({
    number: String(index + 1).padStart(2, "0"),
    title: page.id === "home" ? loadGuidebookManuscript().openingHeading : page.title,
    path: page.path,
    id: page.id,
  }));
}
