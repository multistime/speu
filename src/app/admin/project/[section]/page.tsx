import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProjectDocPageClient } from "@/components/admin/ProjectDocPageClient";
import { loadProjectDocByKey } from "@/lib/project-docs-load";
import {
  PROJECT_DOCS_NAV_SECTIONS,
  parseProjectDocRouteSegment,
  type ProjectDocsSectionKey,
} from "@/lib/project-docs-nav-data";

type Params = { params: Promise<{ section: string }> };

function metaForKey(key: ProjectDocsSectionKey): { title: string; description: string } {
  const row = PROJECT_DOCS_NAV_SECTIONS.find((s) => s.key === key);
  return {
    title: row ? `${row.label} — праект` : "Праект",
    description: row ? `${row.label} (${row.file}) — дакументацыя Спеў.` : "",
  };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { section } = await params;
  const key = parseProjectDocRouteSegment(section);
  if (!key) return { title: "Праект" };
  const { title, description } = metaForKey(key);
  return { title, description };
}

export default async function AdminProjectSectionPage({ params }: Params) {
  const { section } = await params;
  const key = parseProjectDocRouteSegment(section);
  if (!key) notFound();

  const markdown = await loadProjectDocByKey(key);
  const row = PROJECT_DOCS_NAV_SECTIONS.find((s) => s.key === key)!;

  return <ProjectDocPageClient title={row.label} file={row.file} markdown={markdown} />;
}
