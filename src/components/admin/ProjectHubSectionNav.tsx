"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ListTodo, Map, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PROJECT_DOCS_NAV_SECTIONS,
  projectDocPath,
  type ProjectDocsSectionKey,
} from "@/lib/project-docs-nav-data";

const ICONS: Record<ProjectDocsSectionKey, typeof BookOpen> = {
  overview: BookOpen,
  roadmap: Map,
  tickets: ListTodo,
  readme: PanelLeft,
};

/** Падраздзелы хаба праекту — як меню адмінкі (асобныя URL) */
export function ProjectHubSectionNav() {
  const pathname = usePathname();
  const base = "/admin/project";

  if (!pathname.startsWith(base)) return null;

  return (
    <nav className="space-y-0.5" aria-label="Раздзелы праекту">
      {PROJECT_DOCS_NAV_SECTIONS.map(({ key, label, blurb, file }) => {
        const href = projectDocPath(key);
        const active = pathname === href;
        const Icon = ICONS[key];
        return (
          <Link
            key={key}
            href={href}
            className={cn(
              "w-full text-left rounded-xl px-2.5 py-2 transition-colors flex gap-2.5 items-start",
              active ? "bg-primary/12 text-primary" : "text-foreground/75 hover:bg-muted"
            )}
          >
            <Icon className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
            <span className="min-w-0">
              <span className="block text-sm font-medium leading-tight">{label}</span>
              <span className="block text-[11px] text-muted-foreground mt-0.5 leading-snug">{blurb}</span>
              <span className="block text-[10px] font-mono text-muted-foreground/70 mt-1">{file}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
