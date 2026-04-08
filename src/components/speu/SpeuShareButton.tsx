"use client";

import { Check, Share2 } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

type SpeuShareButtonProps = {
  /** Шлях без host, напрыклад /speu/tracks/slug */
  path: string;
  /** Загаловак для Web Share API */
  title?: string;
  /** Дадатковы тэкст для Web Share API */
  text?: string;
  className?: string;
};

function buildAbsoluteUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (typeof window === "undefined") return p;
  return `${window.location.origin}${p}`;
}

export function SpeuShareButton({ path, title, text, className }: SpeuShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const onShare = useCallback(async () => {
    const url = buildAbsoluteUrl(path);
    const shareTitle = title?.trim() || (typeof document !== "undefined" ? document.title : "Спеў");

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: text?.trim() || shareTitle,
          url,
        });
        return;
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* ignore */
    }
  }, [path, title, text]);

  return (
    <button
      type="button"
      onClick={() => void onShare()}
      aria-label={copied ? "Спасылка скапіявана" : "Падзяліцца"}
      className={cn(
        "box-border inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card p-0 text-muted-foreground transition-colors",
        "hover:bg-muted/60 hover:text-foreground",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40",
        copied && "text-primary",
        className
      )}
    >
      {copied ? (
        <Check className="size-[1.15rem] shrink-0" strokeWidth={2} aria-hidden />
      ) : (
        <Share2 className="size-[1.15rem] shrink-0" strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}
