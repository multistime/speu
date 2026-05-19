"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useSpeuHubData } from "@/contexts/SpeuHubDataContext";
import { useTrackLikes } from "@/contexts/TrackLikesContext";
import { SpeuHubClient } from "@/components/speu/SpeuHubClient";
import type { SpeuPublicTrack } from "@/lib/speu/types";

/** Обёртка: данные хаба з кэша SpeuHubDataProvider. */
export function SpeuHubPageClient() {
  const { playable, chartRows, artists, heroDiscScale, loading, error } = useSpeuHubData();
  const { user, authReady, isLiked } = useTrackLikes();

  const likedPreview = useMemo(() => {
    if (!authReady || !user) return [] as SpeuPublicTrack[];
    const out: SpeuPublicTrack[] = [];
    for (const t of playable) {
      if (isLiked(t.id)) {
        out.push(t);
        if (out.length >= 10) break;
      }
    }
    return out;
  }, [playable, authReady, user, isLiked]);

  if (loading && playable.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" aria-hidden />
        <span className="sr-only">Загрузка</span>
      </div>
    );
  }

  if (error && playable.length === 0) {
    return (
      <div className="px-3 text-center text-sm text-muted-foreground">
        Не ўдалося загрузіць каталог. Паспрабуйце абнавіць старонку.
      </div>
    );
  }

  return (
    <SpeuHubClient
      playable={playable}
      chartRows={chartRows}
      artists={artists}
      likedPreview={likedPreview}
      heroDiscScale={heroDiscScale}
    />
  );
}
