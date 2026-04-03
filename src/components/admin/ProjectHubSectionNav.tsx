"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BookOpen, ListTodo, Map, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PROJECT_DOCS_NAV_SECTIONS,
  PROJECT_DOCS_SECTION_IDS,
  type ProjectDocsSectionKey,
} from "@/lib/project-docs-nav-data";

const ICONS: Record<ProjectDocsSectionKey, typeof BookOpen> = {
  overview: BookOpen,
  roadmap: Map,
  tickets: ListTodo,
  readme: PanelLeft,
};

const SECTION_DOM_IDS = PROJECT_DOCS_NAV_SECTIONS.map((s) => PROJECT_DOCS_SECTION_IDS[s.key]);

export const PROJECT_SECTION_NAV_EVENT = "speu-project-section-nav";

export function scrollToProjectDocSection(id: string) {
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    history.replaceState(null, "", `#${id}`);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(PROJECT_SECTION_NAV_EVENT, { detail: { id } }));
}

/** Змест хаба праекту: scroll-spy і скокі да #id (толькі на /admin/project) */
export function ProjectHubSectionNav() {
  const pathname = usePathname();
  const [activeId, setActiveId] = useState<string>(PROJECT_DOCS_SECTION_IDS.overview);

  const onSectionClick = useCallback((id: string) => {
    scrollToProjectDocSection(id);
  }, []);

  useEffect(() => {
    const onNav = (e: Event) => {
      const id = (e as CustomEvent<{ id: string }>).detail?.id;
      if (id) setActiveId(id);
    };
    window.addEventListener(PROJECT_SECTION_NAV_EVENT, onNav);
    return () => window.removeEventListener(PROJECT_SECTION_NAV_EVENT, onNav);
  }, []);

  useEffect(() => {
    if (pathname !== "/admin/project") return;

    const hash = window.location.hash?.slice(1);
    if (hash && document.getElementById(hash)) {
      requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ block: "start" }));
      setActiveId(hash);
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/admin/project") return;

    let obs: IntersectionObserver | null = null;
    let cancelled = false;

    let attempts = 0;
    const attach = () => {
      if (cancelled || attempts++ > 160) return;
      const els = SECTION_DOM_IDS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
      if (els.length < SECTION_DOM_IDS.length) {
        requestAnimationFrame(attach);
        return;
      }

      obs = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          if (visible[0]?.target?.id) setActiveId(visible[0].target.id);
        },
        { rootMargin: "-12% 0px -55% 0px", threshold: [0, 0.1, 0.25, 0.5, 1] }
      );
      els.forEach((el) => obs!.observe(el));
    };

    attach();

    return () => {
      cancelled = true;
      obs?.disconnect();
    };
  }, [pathname]);

  if (pathname !== "/admin/project") return null;

  return (
    <nav className="space-y-0.5" aria-label="Змест хаба праекту">
      {PROJECT_DOCS_NAV_SECTIONS.map(({ key, label, blurb, file }) => {
        const id = PROJECT_DOCS_SECTION_IDS[key];
        const Icon = ICONS[key];
        const active = activeId === id;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSectionClick(id)}
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
          </button>
        );
      })}
    </nav>
  );
}
