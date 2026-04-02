import type { Components } from "react-markdown";
import { cn } from "@/lib/utils";

/** Стылі для markdown у хабе праекту (адмінка). */
export const projectDocMarkdownComponents: Partial<Components> = {
  h1: ({ children }) => (
    <h1 className="font-display text-2xl font-semibold text-foreground mb-4 mt-0 scroll-mt-32">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-semibold text-foreground mt-8 mb-3 first:mt-0 border-b border-border pb-2 scroll-mt-32">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-foreground mt-6 mb-2 scroll-mt-32">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-sm leading-relaxed text-foreground/90 mb-4 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 mb-4 space-y-1.5 text-sm text-foreground/90">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 mb-4 space-y-1.5 text-sm text-foreground/90">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-primary underline underline-offset-2 hover:text-primary/80"
      target="_blank"
      rel="noreferrer noopener"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-8 border-border" />,
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4 rounded-lg border border-border shadow-sm">
      <table className="w-full text-sm border-collapse min-w-[min(100%,520px)]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/80">{children}</thead>,
  th: ({ children }) => (
    <th className="text-left font-semibold px-3 py-2.5 border-b border-border whitespace-nowrap">{children}</th>
  ),
  td: ({ children }) => <td className="px-3 py-2.5 border-b border-border align-top">{children}</td>,
  tr: ({ children }) => <tr>{children}</tr>,
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className);
    if (!isBlock) {
      return (
        <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded text-foreground" {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className={cn("font-mono text-xs", className)} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-muted/90 rounded-lg p-4 overflow-x-auto mb-4 text-xs font-mono border border-border">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/40 pl-4 my-4 text-sm text-muted-foreground italic">
      {children}
    </blockquote>
  ),
};
