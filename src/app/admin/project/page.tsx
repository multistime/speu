import fs from "fs/promises";
import path from "path";
import type { Metadata } from "next";
import { ProjectDocsView } from "@/components/admin/ProjectDocsView";

export const metadata: Metadata = {
  title: "Праект — дакументацыя",
  description: "База ведаў, роадмэп і тікеты Speu (markdown з docs/project).",
};

async function loadProjectDoc(filename: string): Promise<string> {
  const filePath = path.join(process.cwd(), "docs", "project", filename);
  return fs.readFile(filePath, "utf-8");
}

export default async function AdminProjectDocsPage() {
  const [overview, roadmap, tickets, readme] = await Promise.all([
    loadProjectDoc("OVERVIEW.md"),
    loadProjectDoc("ROADMAP.md"),
    loadProjectDoc("TICKETS.md"),
    loadProjectDoc("README.md"),
  ]);

  return (
    <ProjectDocsView overview={overview} roadmap={roadmap} tickets={tickets} readme={readme} />
  );
}
