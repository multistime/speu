"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Disc3, Music, Play, User } from "lucide-react";
import { SpeuInlineNavLink } from "@/components/speu/SpeuInlineNavLink";
import { SpeuShareButton } from "@/components/speu/SpeuShareButton";
import { SpeuTrackRow } from "@/components/speu/SpeuTrackRow";
import { TrackLikeButton } from "@/components/speu/TrackLikeButton";
import { usePlayer } from "@/contexts/PlayerContext";
import { speuPublicTrackToPlayerTrack } from "@/lib/speu/player-map";
import type { SpeuTrackPageData } from "@/lib/speu/types";
import { cn } from "@/lib/utils";

/** Вышыня згорнутага тэксту (~9–10 радкоў); калі вышэй — фейд і кнопка */
const LYRICS_COLLAPSED_MAX_PX = 220;

function TrackLyricsPanel({
  lyrics,
  accent,
  accentRgb,
}: {
  lyrics: string;
  accent: string;
  accentRgb: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const measureRef = useRef<HTMLDivElement>(null);
  const [isTruncatable, setIsTruncatable] = useState(false);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const measure = () => {
      setIsTruncatable(el.scrollHeight > LYRICS_COLLAPSED_MAX_PX);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [lyrics]);

  const showFade = isTruncatable && !expanded;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/55",
        "bg-gradient-to-br from-muted/30 via-background to-background",
        "px-6 pt-8 sm:px-10 sm:pt-10",
        isTruncatable ? "pb-4 sm:pb-5" : "pb-8 sm:pb-10"
      )}
      style={{
        boxShadow: `inset 0 1px 0 rgba(${accentRgb}, 0.07)`,
      }}
    >
      <div
        className="absolute left-0 top-3 bottom-3 w-1 rounded-full opacity-90"
        style={{ background: accent }}
        aria-hidden
      />
      <div className="relative pl-5 sm:pl-6">
        <div
          className={cn(
            "relative",
            showFade && "max-h-[min(13.75rem,42svh)] overflow-hidden"
          )}
        >
          <div
            ref={measureRef}
            className={cn(
              "font-serif text-[1.0625rem] leading-[1.8] text-foreground/[0.88]",
              "sm:text-lg sm:leading-8 whitespace-pre-wrap selection:bg-primary/15"
            )}
          >
            {lyrics}
          </div>
          {showFade ? (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background from-40% via-background/85 to-transparent"
              aria-hidden
            />
          ) : null}
        </div>

        {isTruncatable ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary",
              "transition-colors hover:text-primary/85 hover:underline underline-offset-2",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40 rounded-sm"
            )}
            aria-expanded={expanded}
          >
            {expanded ? "Згарнуць" : "Увесь тэкст"}
            <ChevronDown
              className={cn("size-4 shrink-0 transition-transform duration-200", expanded && "rotate-180")}
              strokeWidth={2}
              aria-hidden
            />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function SpeuTrackPageView({ data }: { data: SpeuTrackPageData }) {
  const { togglePlay, playPlaylistAt } = usePlayer();
  const { track, sameAlbum, lyrics } = data;
  const [likeCount, setLikeCount] = useState(() => data.likeCount);
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

  const showAlbumSection = sameAlbum.length > 0 && track.album;
  const hasLyrics = Boolean(lyrics && lyrics.length > 0);

  return (
    <div className="min-h-screen pt-20 pb-24 px-3 sm:px-6 lg:px-8">
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

          <div className="flex-1 min-w-0 flex flex-col text-left">
            <p className="text-xs uppercase tracking-widest text-primary/70 mb-2 font-medium">Трэк</p>

            <div className="flex flex-row items-start gap-3 sm:gap-6">
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-foreground italic min-w-0 flex-1 pr-1 sm:pr-4 leading-tight">
                {track.title}
              </h1>
              <div className="flex items-start gap-2 shrink-0 pt-0.5 sm:pt-1">
                <button
                  type="button"
                  onClick={playMain}
                  aria-label="Прайграць"
                  className="inline-flex size-11 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
                  style={{ background: accent }}
                >
                  <Play className="size-[1.35rem] fill-current ml-0.5" strokeWidth={0} />
                </button>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <TrackLikeButton
                    trackId={track.id}
                    size="md"
                    accentColor={accent}
                    likeCount={likeCount}
                    onLikeCount={setLikeCount}
                    className="size-11 !min-h-11 !min-w-11 !max-h-11 !max-w-11 rounded-xl border border-border bg-card !p-0 hover:bg-muted/60"
                  />
                  <span className="text-[10px] text-muted-foreground tabular-nums leading-none">
                    {likeCount}
                  </span>
                </div>
                <SpeuShareButton
                  path={`/speu/tracks/${track.slug}`}
                  title={track.title}
                  text={track.artistLine}
                  className="size-11 !min-h-11 !min-w-11 !max-h-11 !max-w-11 !p-0"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:mt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {track.artists.map((a) => (
                  <Link
                    key={a.id}
                    href={`/speu/artists/${a.slug}`}
                    className={cn(
                      "group inline-flex max-w-full min-w-0 items-center gap-3 rounded-2xl border border-border/60 bg-card/25 py-2 pl-2 pr-4",
                      "transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.06]",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40"
                    )}
                  >
                    <div
                      className="relative size-[3.25rem] shrink-0 overflow-hidden rounded-full border border-border/70 bg-muted/50"
                      style={
                        accentRgb
                          ? { boxShadow: `0 0 0 1px rgba(${accentRgb}, 0.12)` }
                          : undefined
                      }
                    >
                      {a.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.photoUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-primary/[0.08]">
                          <User className="size-6 text-primary/70" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                    <span className="min-w-0 text-left text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-lg">
                      {a.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {hasLyrics && lyrics ? (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-12 scroll-mt-28"
            aria-labelledby="track-lyrics-heading"
          >
            <h2
              id="track-lyrics-heading"
              className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground/65"
            >
              Тэкст песні
            </h2>
            <TrackLyricsPanel lyrics={lyrics} accent={accent} accentRgb={accentRgb} />
          </motion.section>
        ) : null}

        {showAlbumSection && track.album ? (
          <section aria-label={`Трэкі з альбома ${track.album.title}`}>
            <div className="flex justify-end mb-3">
              <SpeuInlineNavLink
                href={`/speu/albums/${track.album.slug}`}
                className="max-w-[min(100%,24rem)] text-sm text-muted-foreground"
                leading={<Disc3 className="size-3.5 shrink-0 text-muted-foreground/60" strokeWidth={1.5} />}
              >
                З альбома «{track.album.title}»
              </SpeuInlineNavLink>
            </div>
            <div className="space-y-0.5 rounded-xl border border-border/60 bg-card/30 p-1.5 sm:p-3">
              {sameAlbum.map((t) => {
                const i = albumTracksOrdered.findIndex((x) => x.id === t.id);
                return (
                  <SpeuTrackRow key={t.id} track={t} index={i} showCover playlist={albumPlaylist} />
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
