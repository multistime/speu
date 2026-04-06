"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Disc3, Music, Play } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { speuPublicTrackToPlayerTrack } from "@/lib/speu/player-map";
import type { SpeuTrackPageData } from "@/lib/speu/types";
import { SpeuTrackRow } from "@/components/speu/SpeuTrackRow";
import { TrackLikeButton } from "@/components/speu/TrackLikeButton";

export function SpeuTrackPageView({ data }: { data: SpeuTrackPageData }) {
  const { togglePlay } = usePlayer();
  const { track, sameAlbum } = data;
  const pt = speuPublicTrackToPlayerTrack(track);
  const { accentColor: accent, accentRgb } = track;

  return (
    <div className="min-h-screen pt-28 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border overflow-hidden bg-card shadow-xl mb-10"
          style={{ boxShadow: `0 0 60px rgba(${accentRgb}, 0.12)` }}
        >
          <div className="relative h-56 sm:h-64 flex items-end p-6 sm:p-8 overflow-hidden">
            {track.coverUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={track.coverUrl}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
              </>
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background: `linear-gradient(160deg, ${track.accentColor}55 0%, var(--card) 100%)`,
                }}
              >
                <Music className="size-24 opacity-20" style={{ color: accent }} strokeWidth={1} />
              </div>
            )}
            <div className="relative z-10 w-full">
              <p className="text-xs uppercase tracking-widest text-white/70 mb-2 font-medium">
                Трэк
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white italic mb-3">
                {track.title}
              </h1>
              <div className="flex flex-wrap gap-2 text-sm">
                {track.artists.map((a) => (
                  <Link
                    key={a.id}
                    href={`/speu/artists/${a.slug}`}
                    className="text-white/90 hover:text-white underline-offset-2 hover:underline"
                  >
                    {a.name}
                  </Link>
                ))}
              </div>
              {track.album && (
                <Link
                  href={`/speu/albums/${track.album.slug}`}
                  className="inline-flex items-center gap-2 mt-3 text-sm text-white/75 hover:text-white transition-colors"
                >
                  <Disc3 className="size-3.5" strokeWidth={1.5} />
                  {track.album.title}
                </Link>
              )}
            </div>
          </div>

          <div className="p-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => togglePlay(pt)}
              className="inline-flex items-center gap-2 text-sm px-5 py-3 rounded-xl text-white font-medium"
              style={{ background: accent }}
            >
              <Play className="size-4 fill-current ml-0.5" strokeWidth={0} />
              Прайграць
            </button>
            <TrackLikeButton trackId={track.id} size="md" accentColor={accent} className="border-border" />
            <Link
              href="/speu"
              className="inline-flex items-center text-sm px-4 py-3 rounded-xl border border-border hover:bg-muted/50 transition-colors"
            >
              Хаб «Спеў»
            </Link>
          </div>
        </motion.div>

        {sameAlbum.length > 0 && track.album && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground/50 mb-3 font-medium">
              З альбома «{track.album.title}»
            </h2>
            <div className="space-y-0.5 rounded-xl border border-border/60 bg-card/30 p-2 sm:p-3">
              {sameAlbum.map((t, i) => (
                <SpeuTrackRow key={t.id} track={t} index={i + 1} showCover />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
