"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Music } from "lucide-react";
import { SpeuTrackRow } from "@/components/speu/SpeuTrackRow";
import { useSpeuHubData } from "@/contexts/SpeuHubDataContext";
import { useTrackLikes } from "@/contexts/TrackLikesContext";
import { speuPublicTrackToPlayerTrack } from "@/lib/speu/player-map";

export function SpeuLikedPageClient() {
  const { playable, loading } = useSpeuHubData();
  const { user, authReady, isLiked } = useTrackLikes();

  const liked = useMemo(() => {
    if (!user) return [];
    return playable.filter((t) => isLiked(t.id));
  }, [playable, user, isLiked]);

  const likedPlaylist = useMemo(() => liked.map(speuPublicTrackToPlayerTrack), [liked]);

  return (
    <div className="pb-24 px-3 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-[0.18em] text-primary/70 mb-3 font-medium text-center">
          Спеў
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-2 text-center italic">
          Любімае
        </h1>
        {!authReady || loading ? (
          <p className="text-sm text-muted-foreground text-center mb-8">Загрузка…</p>
        ) : !user ? (
          <p className="text-sm text-muted-foreground text-center mb-8 max-w-md mx-auto">
            Увайдзіце ў акаўнт, каб бачыць залайканыя трэкі.{" "}
            <Link href="/cabinet" className="text-primary font-medium underline-offset-4 hover:underline">
              Увайсці
            </Link>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground text-center mb-8 max-w-lg mx-auto">
            Трэкі, якія вы адзначылі сэрцам.
          </p>
        )}
        {user && liked.length === 0 && !loading ? (
          <div className="glass rounded-xl border border-border p-12 text-center text-muted-foreground">
            <Music className="h-10 w-10 mx-auto mb-3 opacity-25" strokeWidth={1} />
            <p className="text-sm">Пакуль няма залайканых трэкаў.</p>
          </div>
        ) : null}
        {user && liked.length > 0 ? (
          <div className="space-y-0.5 rounded-xl border border-border/60 bg-card/30 p-1.5 sm:p-3">
            {liked.map((t, i) => (
              <SpeuTrackRow key={t.id} track={t} index={i} showCover playlist={likedPlaylist} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
