"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { ArtistListenTrackRow } from "@/lib/speu/artist-analytics";
import { cn } from "@/lib/utils";

export function ListenTracksTable({
  tracks,
  linkAccent,
  onTrackClick,
}: {
  tracks: ArtistListenTrackRow[];
  linkAccent: "emerald" | "primary";
  onTrackClick?: (t: ArtistListenTrackRow) => void;
}) {
  const linkHover =
    linkAccent === "emerald"
      ? "hover:text-emerald-600 dark:hover:text-emerald-400"
      : "hover:text-primary";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-5 py-3 font-medium">Трэк</th>
            <th className="px-3 py-3 font-medium text-right tabular-nums">За перыяд</th>
            <th className="px-3 py-3 font-medium text-right tabular-nums hidden sm:table-cell">Поўн.</th>
            <th className="px-3 py-3 font-medium text-right tabular-nums hidden sm:table-cell">Частк.</th>
            <th className="px-3 py-3 font-medium text-right tabular-nums">Усяго</th>
            <th className="px-5 py-3 font-medium text-right tabular-nums hidden md:table-cell">Лайкі</th>
            <th className="px-4 py-3 w-10" aria-label="Спасылка" />
          </tr>
        </thead>
        <tbody>
          {tracks.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                Няма трэкаў
              </td>
            </tr>
          ) : (
            tracks.map((t) => {
              const periodTotal = t.period_full + t.period_partial;
              const allTotal = t.all_full + t.all_partial;
              const href = t.slug ? `/speu/tracks/${encodeURIComponent(t.slug)}` : null;
              return (
                <tr key={t.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-3 max-w-[12rem] sm:max-w-xs truncate">
                    {onTrackClick ? (
                      <button
                        type="button"
                        onClick={() => onTrackClick(t)}
                        className="font-medium text-foreground text-left truncate w-full hover:underline"
                      >
                        {t.title}
                      </button>
                    ) : (
                      <span className="font-medium text-foreground">{t.title}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-foreground">{periodTotal}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                    {t.period_full}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                    {t.period_partial}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-foreground">{allTotal}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-muted-foreground hidden md:table-cell">
                    {t.like_count}
                  </td>
                  <td className="px-4 py-3">
                    {href ? (
                      <Link
                        href={href}
                        className={cn("inline-flex text-muted-foreground", linkHover)}
                        aria-label="Адкрыць трэк"
                      >
                        <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
                      </Link>
                    ) : (
                      <span className="inline-block w-4" />
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
