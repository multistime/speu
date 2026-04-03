import fs from "fs/promises";
import path from "path";
import type { ProjectDocsSectionKey } from "@/lib/project-docs-nav-data";
import { PROJECT_DOCS_NAV_SECTIONS } from "@/lib/project-docs-nav-data";

const DOC_BY_KEY: Record<ProjectDocsSectionKey, string> = Object.fromEntries(
  PROJECT_DOCS_NAV_SECTIONS.map((s) => [s.key, s.file])
) as Record<ProjectDocsSectionKey, string>;

export async function loadProjectDocFile(filename: string): Promise<string> {
  const filePath = path.join(process.cwd(), "docs", "project", filename);
  return fs.readFile(filePath, "utf-8");
}

export async function loadProjectDocByKey(key: ProjectDocsSectionKey): Promise<string> {
  return loadProjectDocFile(DOC_BY_KEY[key]);
}
