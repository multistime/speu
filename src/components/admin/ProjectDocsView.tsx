"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowUp,
  BookOpen,
  ChevronRight,
  Copy,
  ListTodo,
  Map,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { projectDocMarkdownComponents } from "@/components/admin/project-doc-markdown";

const SECTION_IDS = {
  overview: "project-overview",
  roadmap: "project-roadmap",
  tickets: "project-tickets",
  readme: "project-readme",
} as const;

type SectionKey = keyof typeof SECTION_IDS;

const navSections: {
  key: SectionKey;
  label: string;
  file: string;
  icon: typeof BookOpen;
  blurb: string;
}[] = [
  {
    key: "overview",
    label: "База ведаў",
    file: "OVERVIEW.md",
    icon: BookOpen,
    blurb: "Прадукт, стэйкхолдэры, рызыкі",
  },
  {
    key: "roadmap",
    label: "Роадмэп",
    file: "ROADMAP.md",
    icon: Map,
    blurb: "Планы па часе",
  },
  {
    key: "tickets",
    label: "Тікеты",
    file: "TICKETS.md",
    icon: ListTodo,
    blurb: "Бэклог і статусы",
  },
  {
    key: "readme",
    label: "Структура файлаў",
    file: "README.md",
    icon: PanelLeft,
    blurb: "Што за што адказвае",
  },
];

type ProjectDocsViewProps = {
  overview: string;
  roadmap: string;
  tickets: string;
  readme: string;
};

function sectionSource(
  key: SectionKey,
  props: Pick<ProjectDocsViewProps, "overview" | "roadmap" | "tickets" | "readme">
): string {
  switch (key) {
    case "roadmap":
      return props.roadmap;
    case "tickets":
      return props.tickets;
    case "readme":
      return props.readme;
    default:
      return props.overview;
  }
}

export function ProjectDocsView({ overview, roadmap, tickets, readme }: ProjectDocsViewProps) {
  const sources = useMemo(
    () => ({ overview, roadmap, tickets, readme }),
    [overview, roadmap, tickets, readme]
  );

  const [activeId, setActiveId] = useState<string>(SECTION_IDS.overview);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  /** На мабільным змест па змаўчанні згорнуты — спачатку кантэнт; на lg заўсёды бачны. */
  const [showNav, setShowNav] = useState(false);

  const scrollToId = useCallback((id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      history.replaceState(null, "", `#${id}`);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const hash = window.location.hash?.slice(1);
    if (hash && document.getElementById(hash)) {
      requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ block: "start" }));
      setActiveId(hash);
    }
  }, []);

  useEffect(() => {
    const ids = navSections.map((s) => SECTION_IDS[s.key]);
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-12% 0px -55% 0px", threshold: [0, 0.1, 0.25, 0.5, 1] }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [overview, roadmap, tickets, readme]);

  const copySectionLink = useCallback(async (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  const showBackTop = useScrollPast(400);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="relative space-y-3 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-primary/80 font-medium">Інфополе праекту</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Speu — база ведаў і планы
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Усё ў адным скроле: агляд прадукту, роадмэп, тікеты і апісанне файлаў. Крыніца праўды — markdown у{" "}
            <code className="text-xs font-mono bg-background/60 px-1.5 py-0.5 rounded border border-border/80">
              docs/project/
            </code>
            . Я абнаўляю гэтыя файлы разам з вамі; пасля змен перазапусціце dev або задэплойце.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {navSections.map(({ key, label, file }) => (
              <button
                key={key}
                type="button"
                onClick={() => scrollToId(SECTION_IDS[key])}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-3 py-1.5 text-xs font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
                {label}
                <span className="text-muted-foreground font-normal">· {file}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
        <button
          type="button"
          onClick={() => setShowNav((v) => !v)}
          className="lg:hidden w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-card/80 py-2.5 text-sm font-medium text-foreground"
        >
          <PanelLeft className="w-4 h-4" strokeWidth={1.75} />
          {showNav ? "Схаваць змест" : "Паказаць змест"}
        </button>

        <aside
          className={cn(
            "w-full lg:w-56 shrink-0 lg:sticky lg:top-24 space-y-3",
            showNav ? "block" : "hidden",
            "lg:block"
          )}
        >
          <div className="glass rounded-2xl border border-border p-3">
            <p className="px-2 pt-1 pb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              На старонцы
            </p>
            <nav className="space-y-0.5" aria-label="Раздзелы">
              {navSections.map(({ key, label, icon: Icon, blurb, file }) => {
                const id = SECTION_IDS[key];
                const active = activeId === id;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => scrollToId(id)}
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
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-14 sm:space-y-16 pb-24">
          {navSections.map(({ key, label, file }) => {
            const id = SECTION_IDS[key];
            const source = sectionSource(key, sources);
            return (
              <section
                key={key}
                id={id}
                className="scroll-mt-28"
                aria-labelledby={`${id}-heading`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                  <div className="space-y-1">
                    <h2
                      id={`${id}-heading`}
                      className="font-display text-xl sm:text-2xl font-semibold text-foreground"
                    >
                      {label}
                    </h2>
                    <p className="text-xs font-mono text-muted-foreground">docs/project/{file}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copySectionLink(id)}
                    className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground/80 hover:bg-muted transition-colors shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" strokeWidth={2} />
                    {copiedId === id ? "Спасылка скапіявана" : "Спасылка на раздзел"}
                  </button>
                </div>

                <article className="glass rounded-2xl border border-border p-5 sm:p-8 shadow-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={projectDocMarkdownComponents}>
                    {source}
                  </ReactMarkdown>
                </article>
              </section>
            );
          })}
        </div>
      </div>

      {showBackTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-6 z-40 flex items-center gap-2 rounded-full border border-border bg-card/95 backdrop-blur-md px-4 py-2.5 text-sm font-medium text-foreground shadow-lg hover:bg-muted transition-colors"
          aria-label="Уверх"
        >
          <ArrowUp className="w-4 h-4" strokeWidth={2} />
          Уверх
        </button>
      ) : null}
    </div>
  );
}

function useScrollPast(px: number) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > px);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [px]);
  return past;
}
