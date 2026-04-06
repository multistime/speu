"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Music, Play, User } from "lucide-react";
import type { SpeuAlbumPageData } from "@/lib/speu/types";
import { SpeuTrackRow } from "@/components/speu/SpeuTrackRow";
import { usePlayer } from "@/contexts/PlayerContext";
import { speuPublicTrackToPlayerTrack } from "@/lib/speu/player-map";

export function SpeuAlbumPageView({ data }: { data: SpeuAlbumPageData }) {
  const { startNonStopShuffle, togglePlay } = usePlayer();
  const { accent, accentRgb, gradientFrom, gradientTo } = data.artist.theme;
  const playable = data.tracks;

  const playAlbumShuffle = () => {
    if (playable.length === 0) return;
    startNonStopShuffle(playable.map(speuPublicTrackToPlayerTrack));
  };

  const playFirst = () => {
    const first = playable[0];
    if (first) togglePlay(speuPublicTrackToPlayerTrack(first));
  };

  return (
    <div className="min-h-screen pt-28 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-8 mb-10"
        >
          <div
            className="w-full sm:w-52 shrink-0 aspect-square rounded-2xl border border-border overflow-hidden shadow-lg mx-auto sm:mx-0"
            style={{
              boxShadow: `0 0 50px rgba(${accentRgb}, 0.12)`,
              background: data.coverUrl
                ? undefined
                : `linear-gradient(160deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
            }}
          >
            {data.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.coverUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="size-full flex items-center justify-center">
                <Music className="size-16 opacity-30" style={{ color: accent }} strokeWidth={1} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="text-xs uppercase tracking-widest text-primary/70 mb-2 font-medium">
              Альбом
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-foreground italic mb-3">
              {data.title}
            </h1>
            <Link
              href={`/speu/artists/${data.artist.slug}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
            >
              <User className="size-3.5 shrink-0" strokeWidth={1.5} />
              {data.artist.name}
            </Link>
            {data.releaseDate && (
              <p className="text-xs text-muted-foreground font-mono mb-4">{data.releaseDate}</p>
            )}
            {data.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{data.description}</p>
            )}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <button
                type="button"
                disabled={playable.length === 0}
                onClick={playFirst}
                className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl text-white font-medium disabled:opacity-40"
                style={{ background: accent }}
              >
                <Play className="size-4 fill-current" strokeWidth={0} />
                Слухаць з пачатку
              </button>
              <button
                type="button"
                disabled={playable.length < 2}
                onClick={playAlbumShuffle}
                className="text-sm px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted/60 transition-colors disabled:opacity-40"
              >
                Перамяшаць альбом
              </button>
            </div>
          </div>
        </motion.div>

        <h2 className="text-xs uppercase tracking-widest text-muted-foreground/50 mb-3 font-medium">
          Трэкі
        </h2>
        <div className="space-y-0.5 rounded-xl border border-border/60 bg-card/30 p-2 sm:p-3">
          {data.tracks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Альбом пусты.</p>
          ) : (
            data.tracks.map((t, i) => <SpeuTrackRow key={t.id} track={t} index={i} showCover />)
          )}
        </div>

        <p className="mt-8 text-center">
          <Link href="/speu" className="text-sm text-primary hover:underline">
            ← Да хаба «Спеў»
          </Link>
        </p>
      </div>
    </div>
  );
}
