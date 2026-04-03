"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, ChevronRight, Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { projectDocMarkdownComponents } from "@/components/admin/project-doc-markdown";
import { scrollToProjectDocSection } from "@/components/admin/ProjectHubSectionNav";
import type { ProjectHubLinks } from "@/lib/project-hub-links";
import {
  PROJECT_DOCS_NAV_SECTIONS,
  PROJECT_DOCS_SECTION_IDS,
  type ProjectDocsSectionKey,
} from "@/lib/project-docs-nav-data";

type ProjectDocsViewProps = {
  overview: string;
  roadmap: string;
  tickets: string;
  readme: string;
  hubLinks: ProjectHubLinks;
  /** Host бягучага запыту (адмінка) */
  requestHost: string | null;
};

function sectionSource(
  key: ProjectDocsSectionKey,
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

function HubEnvBadge({ deployEnv }: { deployEnv: ProjectHubLinks["deployEnv"] }) {
  if (!deployEnv) return null;
  const styles =
    deployEnv === "production"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25"
      : deployEnv === "preview"
        ? "bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-500/25"
        : "bg-muted text-muted-foreground border-border";
  const labels = {
    production: "Vercel: production",
    preview: "Vercel: preview",
    development: "Vercel: development",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        styles
      )}
    >
      {labels[deployEnv]}
    </span>
  );
}

function QuickEnvLink({
  item,
  variant = "solid",
}: {
  item: { label: string; href: string };
  variant?: "solid" | "ghost";
}) {
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg text-xs font-medium transition-colors",
        variant === "solid"
          ? "border border-primary/25 bg-primary/10 px-3 py-2 text-primary hover:bg-primary/15"
          : "text-muted-foreground hover:text-primary underline-offset-2 hover:underline"
      )}
    >
      {item.label}
      <ExternalLink className="w-3 h-3 opacity-70" aria-hidden />
    </a>
  );
}

export function ProjectDocsView({
  overview,
  roadmap,
  tickets,
  readme,
  hubLinks,
  requestHost,
}: ProjectDocsViewProps) {
  const sources = useMemo(
    () => ({ overview, roadmap, tickets, readme }),
    [overview, roadmap, tickets, readme]
  );

  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        <div className="relative space-y-4 max-w-4xl">
          {/* Спасылкі на асяроддзі і інструменты */}
          <div className="rounded-xl border border-border/90 bg-background/55 backdrop-blur-md p-4 space-y-3 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                  Сайт: прадакшн і стэйдж
                </p>
                <div className="flex flex-wrap gap-2">
                  <QuickEnvLink item={hubLinks.production} />
                  <QuickEnvLink item={hubLinks.staging} />
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug max-w-2xl">
                  URLы наладжваюцца ў Vercel → Environment Variables:{" "}
                  <code className="font-mono text-[10px] bg-muted/80 px-1 rounded">NEXT_PUBLIC_SPEU_PRODUCTION_URL</code>,{" "}
                  <code className="font-mono text-[10px] bg-muted/80 px-1 rounded">NEXT_PUBLIC_SPEU_STAGING_URL</code>.
                  Калі стэйдж не зададзены, адкрываецца спіс preview-дэплояў на Vercel.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <HubEnvBadge deployEnv={hubLinks.deployEnv} />
                {requestHost ? (
                  <span className="text-[11px] text-muted-foreground font-mono">
                    адмінка: {requestHost}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="h-px bg-border/80" />
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {hubLinks.tooling.map((t) => (
                <QuickEnvLink key={t.href} item={t} variant="ghost" />
              ))}
              <a
                href={new URL("/admin/project", hubLinks.production.href).href}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary underline-offset-2 hover:underline"
              >
                Хаб на прадакшне
                <ExternalLink className="w-3 h-3 opacity-70" aria-hidden />
              </a>
            </div>
            {hubLinks.publicSiteOrigin ? (
              <p className="text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground/80">NEXT_PUBLIC_SITE_URL:</span>{" "}
                <span className="font-mono">{hubLinks.publicSiteOrigin}</span>
              </p>
            ) : null}
          </div>

          <p className="text-xs uppercase tracking-[0.2em] text-primary/80 font-medium">Інфополе праекту</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Спеў — база ведаў і планы
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Усё ў адным скроле: агляд прадукту, роадмэп, тікеты і апісанне файлаў. Змест па раздзелах — у бакавым блоцы{" "}
            <span className="font-medium text-foreground/85">Праект</span>. Крыніца праўды — markdown у{" "}
            <code className="text-xs font-mono bg-background/60 px-1.5 py-0.5 rounded border border-border/80">
              docs/project/
            </code>
            . Я абнаўляю гэтыя файлы разам з вамі; пасля змен перазапусціце dev або задэплойце.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {PROJECT_DOCS_NAV_SECTIONS.map(({ key, label, file }) => (
              <button
                key={key}
                type="button"
                onClick={() => scrollToProjectDocSection(PROJECT_DOCS_SECTION_IDS[key])}
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

      <div className="min-w-0 space-y-14 sm:space-y-16 pb-24">
          {PROJECT_DOCS_NAV_SECTIONS.map(({ key, label, file }) => {
            const id = PROJECT_DOCS_SECTION_IDS[key];
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
