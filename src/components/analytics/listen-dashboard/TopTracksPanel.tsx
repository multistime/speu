"use client";

import { useMemo } from "react";
import type { ArtistListenTrackRow } from "@/lib/speu/artist-analytics";
import { cn } from "@/lib/utils";

export function TopTracksPanel({
  tracks,
  accent,
  onSelectTrack,
}: {
  tracks: ArtistListenTrackRow[];
  accent: "emerald" | "primary";
  onSelectTrack: (t: ArtistListenTrackRow) => void;
}) {
  const top = useMemo(() => {
    return [...tracks]
      .sort((a, b) => b.period_full + b.period_partial - (a.period_full + a.period_partial))
      .slice(0, 6);
  }, [tracks]);
  const maxV = Math.max(1, ...top.map((t) => t.period_full + t.period_partial));
  if (top.length === 0) return null;

  const barGrad =
    accent === "emerald"
      ? "bg-gradient-to-r from-emerald-600/80 to-emerald-400/90"
      : "bg-gradient-to-r from-primary/90 to-primary/60";

  return (
    <div className="space-y-2">
      {top.map((t) => {
        const v = t.period_full + t.period_partial;
        const pct = Math.round((v / maxV) * 100);
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelectTrack(t)}
            className={cn(
              "w-full text-left rounded-xl border border-transparent px-2 py-2 -mx-2",
              "hover:bg-muted/50 hover:border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors",
            )}
          >
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium text-foreground">{t.title}</span>
              <span className="tabular-nums text-muted-foreground shrink-0">{v}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full", barGrad)} style={{ width: `${pct}%` }} />
            </div>
            <span className="sr-only">Паказаць дынаміку па днях</span>
          </button>
        );
      })}
    </div>
  );
}
