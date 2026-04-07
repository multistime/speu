"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { Disc3, Music, Play } from "lucide-react";
import { SpeuInlineNavLink } from "@/components/speu/SpeuInlineNavLink";
import { formatTrackDuration } from "@/components/speu/speu-format-duration";
import { SpeuTrackRow } from "@/components/speu/SpeuTrackRow";
import { TrackLikeButton } from "@/components/speu/TrackLikeButton";
import { usePlayer } from "@/contexts/PlayerContext";
import { speuPublicTrackToPlayerTrack } from "@/lib/speu/player-map";
import type { SpeuTrackPageData } from "@/lib/speu/types";

export function SpeuTrackPageView({ data }: { data: SpeuTrackPageData }) {
  const { togglePlay, playPlaylistAt } = usePlayer();
  const { track, sameAlbum } = data;
  const pt = speuPublicTrackToPlayerTrack(track);
  const { accentColor: accent, accentRgb } = track;

  const albumTracksOrdered = useMemo(
    () => [...sameAlbum, track].sort((a, b) => a.sortOrder - b.sortOrder),
    [track, sameAlbum]
  );
  const albumPlaylist = useMemo(
    () => albumTracksOrdered.map(speuPublicTrackToPlayerTrack),
    [albumTracksOrdered]
  );
  const trackIndexInAlbum = useMemo(
    () => albumTracksOrdered.findIndex((t) => t.id === track.id),
    [albumTracksOrdered, track.id]
  );

  const playMain = () => {
    if (albumPlaylist.length > 0 && trackIndexInAlbum >= 0) {
      playPlaylistAt(albumPlaylist, trackIndexInAlbum);
      return;
    }
    togglePlay(pt);
  };

  return (
    <div className="min-h-screen pt-20 pb-24 px-4 sm:px-6 lg:px-8">
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
              background: track.coverUrl
                ? undefined
                : `linear-gradient(160deg, ${track.accentColor}66 0%, var(--card) 100%)`,
            }}
          >
            {track.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={track.coverUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="size-full flex items-center justify-center">
                <Music className="size-16 opacity-30" style={{ color: accent }} strokeWidth={1} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="text-xs uppercase tracking-widest text-primary/70 mb-2 font-medium">Трэк</p>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 mb-3">
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-foreground italic min-w-0">
                {track.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-end shrink-0">
                <button
                  type="button"
                  onClick={playMain}
                  className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl text-white font-medium"
                  style={{ background: accent }}
                >
                  <Play className="size-4 fill-current ml-0.5" strokeWidth={0} />
                  Прайграць
                </button>
                <TrackLikeButton
                  trackId={track.id}
                  size="md"
                  accentColor={accent}
                  className="rounded-xl border border-border bg-card hover:bg-muted/60"
                />
              </div>
            </div>

            <div className="mb-4 flex flex-col items-center gap-3 sm:items-start">
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 sm:justify-start">
                {track.artists.map((a, i) => (
                  <span key={a.id} className="inline-flex items-center gap-2">
                    {i > 0 && (
                      <span className="select-none text-muted-foreground/35" aria-hidden>
                        ·
                      </span>
                    )}
                    <SpeuInlineNavLink href={`/speu/artists/${a.slug}`} className="text-sm">
                      {a.name}
                    </SpeuInlineNavLink>
                  </span>
                ))}
              </div>

              {track.album && (
                <SpeuInlineNavLink
                  href={`/speu/albums/${track.album.slug}`}
                  className="text-sm"
                  leading={<Disc3 className="size-3.5 shrink-0 text-muted-foreground/70" strokeWidth={1.5} />}
                >
                  {track.album.title}
                </SpeuInlineNavLink>
              )}

              {track.durationSec != null && track.durationSec > 0 && (
                <p className="text-xs font-mono text-muted-foreground">{formatTrackDuration(track.durationSec)}</p>
              )}
            </div>
          </div>
        </motion.div>

        {sameAlbum.length > 0 && track.album && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground/50 mb-3 font-medium">
              З альбома «{track.album.title}»
            </h2>
            <div className="space-y-0.5 rounded-xl border border-border/60 bg-card/30 p-2 sm:p-3">
              {sameAlbum.map((t) => {
                const i = albumTracksOrdered.findIndex((x) => x.id === t.id);
                return (
                  <SpeuTrackRow key={t.id} track={t} index={i} showCover playlist={albumPlaylist} />
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
