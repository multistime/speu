"use client";

import { motion } from "framer-motion";
import { SpeuInlineNavLink } from "@/components/speu/SpeuInlineNavLink";
import { Music, Play, Shuffle, User } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { SpeuAlbumPageData } from "@/lib/speu/types";
import { SpeuTrackRow } from "@/components/speu/SpeuTrackRow";
import { usePlayer } from "@/contexts/PlayerContext";
import { speuPublicTrackToPlayerTrack } from "@/lib/speu/player-map";
import { cn } from "@/lib/utils";

function AlbumDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const pRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = pRef.current;
    if (!el) return;
    const measure = () => {
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 22;
      const maxCollapsed = lh * 5 + 1;
      setOverflows(el.scrollHeight > maxCollapsed);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  return (
    <div className="mb-6">
      <div className="relative">
        <p
          ref={pRef}
          className={cn(
            "text-sm text-muted-foreground leading-relaxed",
            overflows && !expanded && "line-clamp-5"
          )}
        >
          {text}
        </p>
        {overflows && !expanded && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-background to-transparent"
            aria-hidden
          />
        )}
      </div>
      {overflows && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? "Згарнуць" : "Паказаць больш"}
        </button>
      )}
    </div>
  );
}

export function SpeuAlbumPageView({ data }: { data: SpeuAlbumPageData }) {
  const { startNonStopShuffle, playPlaylistAt } = usePlayer();
  const { accent, accentRgb, gradientFrom, gradientTo } = data.artist.theme;
  const playable = data.tracks;
  const artistPhoto = data.artist.photoUrl;

  const albumPlaylist = useMemo(
    () => playable.map(speuPublicTrackToPlayerTrack),
    [playable]
  );

  const playAlbumShuffle = () => {
    if (playable.length === 0) return;
    startNonStopShuffle(playable.map(speuPublicTrackToPlayerTrack));
  };

  const playFirst = () => {
    if (albumPlaylist.length === 0) return;
    playPlaylistAt(albumPlaylist, 0);
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

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 mb-3">
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-foreground italic min-w-0">
                {data.title}
              </h1>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-end shrink-0">
                <button
                  type="button"
                  disabled={playable.length === 0}
                  onClick={playFirst}
                  className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl text-white font-medium disabled:opacity-40"
                  style={{ background: accent }}
                >
                  <Play className="size-4 fill-current" strokeWidth={0} />
                  Слухаць
                </button>
                <button
                  type="button"
                  disabled={playable.length < 2}
                  onClick={playAlbumShuffle}
                  className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted/60 transition-colors disabled:opacity-40"
                >
                  <Shuffle className="size-4 shrink-0" strokeWidth={2} />
                  Перамяшаць
                </button>
              </div>
            </div>

            <SpeuInlineNavLink
              href={`/speu/artists/${data.artist.slug}`}
              className="mb-4 text-sm"
              leading={
                artistPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={artistPhoto}
                    alt=""
                    className="size-7 shrink-0 rounded-full border border-border object-cover"
                    aria-hidden
                  />
                ) : (
                  <User className="size-3.5 shrink-0 text-muted-foreground/80" strokeWidth={1.5} />
                )
              }
            >
              {data.artist.name}
            </SpeuInlineNavLink>
            {data.releaseDate && (
              <p className="text-xs text-muted-foreground font-mono mb-4">{data.releaseDate}</p>
            )}
            {data.description && <AlbumDescription text={data.description} />}
          </div>
        </motion.div>

        <h2 className="text-xs uppercase tracking-widest text-muted-foreground/50 mb-3 font-medium">
          Трэкі
        </h2>
        <div className="space-y-0.5 rounded-xl border border-border/60 bg-card/30 p-2 sm:p-3">
          {data.tracks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Альбом пусты.</p>
          ) : (
            data.tracks.map((t, i) => (
              <SpeuTrackRow key={t.id} track={t} index={i} showCover playlist={albumPlaylist} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
