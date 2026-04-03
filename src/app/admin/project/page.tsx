import fs from "fs/promises";
import path from "path";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { ProjectDocsView } from "@/components/admin/ProjectDocsView";
import { getProjectHubLinks } from "@/lib/project-hub-links";

export const metadata: Metadata = {
  title: "Праект — дакументацыя",
  description: "База ведаў, роадмэп і тікеты Спеў (markdown з docs/project).",
};

async function loadProjectDoc(filename: string): Promise<string> {
  const filePath = path.join(process.cwd(), "docs", "project", filename);
  return fs.readFile(filePath, "utf-8");
}

export default async function AdminProjectDocsPage() {
  const [overview, roadmap, tickets, readme, h] = await Promise.all([
    loadProjectDoc("OVERVIEW.md"),
    loadProjectDoc("ROADMAP.md"),
    loadProjectDoc("TICKETS.md"),
    loadProjectDoc("README.md"),
    headers(),
  ]);

  const hubLinks = getProjectHubLinks();
  const requestHost =
    h.get("x-forwarded-host")?.split(",")[0]?.trim() ?? h.get("host") ?? null;

  return (
    <ProjectDocsView
      overview={overview}
      roadmap={roadmap}
      tickets={tickets}
      readme={readme}
      hubLinks={hubLinks}
      requestHost={requestHost}
    />
  );
}
