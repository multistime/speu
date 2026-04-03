"use client";

import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, Copy } from "lucide-react";
import { projectDocMarkdownComponents } from "@/components/admin/project-doc-markdown";

type ProjectDocPageClientProps = {
  title: string;
  file: string;
  markdown: string;
};

export function ProjectDocPageClient({ title, file, markdown }: ProjectDocPageClientProps) {
  const [copied, setCopied] = useState(false);
  const showBackTop = useScrollPast(400);

  const copyPageLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="min-w-0 space-y-5 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1">
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground">{title}</h2>
          <p className="text-xs font-mono text-muted-foreground">docs/project/{file}</p>
        </div>
        <button
          type="button"
          onClick={() => void copyPageLink()}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground/80 hover:bg-muted transition-colors shrink-0"
        >
          <Copy className="w-3.5 h-3.5" strokeWidth={2} />
          {copied ? "Спасылка скапіявана" : "Спасылка на старонку"}
        </button>
      </div>

      <article className="glass rounded-2xl border border-border p-5 sm:p-8 shadow-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={projectDocMarkdownComponents}>
          {markdown}
        </ReactMarkdown>
      </article>

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
