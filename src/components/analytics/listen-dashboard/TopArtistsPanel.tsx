"use client";

import type { ArtistListenLeaderboardRow } from "@/lib/speu/artist-analytics";
import { cn } from "@/lib/utils";

export function TopArtistsPanel({
  artists,
  selectedId,
  onSelect,
}: {
  artists: ArtistListenLeaderboardRow[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  if (artists.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Няма даных па артыстах за перыяд.</p>;
  }

  const maxS = Math.max(1, ...artists.map((a) => a.period_sessions));

  return (
    <div className="space-y-2">
      {artists.slice(0, 12).map((a) => {
        const pct = Math.round((a.period_sessions / maxS) * 100);
        const active = selectedId === a.id;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onSelect(active ? null : a.id)}
            className={cn(
              "w-full text-left rounded-xl border px-2 py-2 -mx-2 transition-colors",
              active
                ? "border-primary/50 bg-primary/10"
                : "border-transparent hover:bg-muted/50 hover:border-border/60",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium text-foreground">{a.name}</span>
              <span className="tabular-nums text-muted-foreground shrink-0">
                {a.period_sessions.toLocaleString("be-BY")}
              </span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/90 to-primary/50"
                style={{ width: `${pct}%` }}
              />
            </div>
          </button>
        );
      })}
      <p className="text-[10px] text-muted-foreground pt-1">
        Націсніце на артыста, каб адфільтраваць графікі і табліцу трэкаў. Паўторны націск — скінуць фільтр.
      </p>
    </div>
  );
}
