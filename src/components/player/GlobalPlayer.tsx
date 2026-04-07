"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Music,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { TrackLikeButton } from "@/components/speu/TrackLikeButton";
import { useCallback, useRef, useState } from "react";
import { usePlayer, type PlayerTrack } from "@/contexts/PlayerContext";
import { formatPlayerTime } from "@/lib/format-player-time";
import { clientXToSeekRatio } from "@/lib/player-progress";
import { cn } from "@/lib/utils";

function GlobalPlayerProgress({ track }: { track: PlayerTrack }) {
  const { currentTime, duration, canSeek, seekRatio, isPlaying } = usePlayer();

  const railRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragRatio, setDragRatio] = useState<number | null>(null);

  const livePct =
    canSeek && duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const progress = dragRatio !== null ? dragRatio : livePct;
  const pct = Math.min(100, Math.max(0, progress * 100));

  const applyRatio = useCallback(
    (ratio: number) => {
      const r = Math.min(1, Math.max(0, ratio));
      setDragRatio(r);
      seekRatio(r);
    },
    [seekRatio]
  );

  const applyFromClientX = useCallback(
    (clientX: number) => {
      const el = railRef.current;
      if (!el || !canSeek) return;
      applyRatio(clientXToSeekRatio(el.getBoundingClientRect(), clientX));
    },
    [canSeek, applyRatio]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canSeek) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    setIsDragging(true);
    applyFromClientX(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !canSeek) return;
    applyFromClientX(e.clientX);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    draggingRef.current = false;
    setIsDragging(false);
    setDragRatio(null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!canSeek || duration <= 0) return;
    const step = e.shiftKey ? 30 : 5;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      seekRatio(Math.min(1, Math.max(0, (currentTime - step) / duration)));
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      seekRatio(Math.min(1, Math.max(0, (currentTime + step) / duration)));
    } else if (e.key === "Home") {
      e.preventDefault();
      seekRatio(0);
    } else if (e.key === "End") {
      e.preventDefault();
      seekRatio(1);
    }
  };

  const fillStyle = track.accentColor
    ? { background: track.accentColor }
    : undefined;

  return (
    <div
      ref={railRef}
      role="slider"
      tabIndex={canSeek ? 0 : -1}
      aria-label="Пазіцыя прайгравання"
      aria-valuemin={0}
      aria-valuemax={canSeek ? Math.round(duration) : 0}
      aria-valuenow={canSeek ? Math.round(currentTime) : 0}
      aria-valuetext={
        canSeek
          ? `${formatPlayerTime(currentTime)} з ${formatPlayerTime(duration)}`
          : isPlaying
            ? "Жывы струмень"
            : "Даўжыня невядомая"
      }
      aria-disabled={!canSeek}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className={cn(
        "absolute inset-x-0 top-0 z-30 h-3 cursor-pointer touch-none select-none",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/45 focus-visible:outline-offset-2 focus-visible:rounded-sm",
        !canSeek && "cursor-not-allowed"
      )}
    >
      {canSeek ? (
        <>
          <div
            className={cn(
              "pointer-events-none absolute left-0 top-0 z-[1] h-px origin-left transition-[opacity,box-shadow]",
              !track.accentColor && "bg-primary",
              isDragging
                ? "opacity-100 shadow-[0_0_10px_rgba(125,191,158,0.2)]"
                : "opacity-[0.95] group-hover/player:opacity-100"
            )}
            style={{
              width: `${pct}%`,
              ...fillStyle,
            }}
            aria-hidden
          />
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute top-0 z-[2] size-[5px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] border border-background/80 shadow-[0_0_6px_rgba(0,0,0,0.35)] transition-transform duration-150 ease-out",
              !track.accentColor && "bg-primary",
              "group-hover/player:scale-110",
              isDragging && "scale-125 ring-1 ring-primary/40"
            )}
            style={{
              left: `${pct}%`,
              ...fillStyle,
            }}
          />
        </>
      ) : (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px overflow-hidden"
          aria-hidden
        >
          {isPlaying ? (
            <div
              className={cn(
                "speu-player-progress-indeterminate h-full w-[22%]",
                track.accentColor ? "" : "bg-primary/75"
              )}
              style={
                track.accentColor
                  ? { background: track.accentColor, opacity: 0.75 }
                  : undefined
              }
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

const ctrlBtn =
  "w-9 h-9 rounded-full border flex items-center justify-center transition-colors shrink-0 disabled:opacity-35 disabled:pointer-events-none";

export function GlobalPlayer() {
  const {
    track,
    isPlaying,
    repeatOne,
    repeatAll,
    shuffleEnabled,
    nonStopActive,
    queueSize,
    currentTime,
    duration,
    canSeek,
    togglePlay,
    toggleRepeatOne,
    toggleRepeatAll,
    toggleShuffle,
    skipNext,
    skipPrevious,
    stop,
  } = usePlayer();

  const queueNav = nonStopActive && queueSize > 0;
  const canShuffle = queueNav && queueSize > 1;
  const canSkipNext = queueNav;

  return (
    <AnimatePresence>
      {track && (
        <motion.div
          key="global-player"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="group/player fixed bottom-0 inset-x-0 z-50 overflow-visible bg-background/95 backdrop-blur-md border-t border-border/40"
          style={
            track.accentRgb
              ? { boxShadow: `0 -4px 40px rgba(${track.accentRgb}, 0.08)` }
              : undefined
          }
        >
          <GlobalPlayerProgress track={track} />

          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-y-2.5 gap-x-3 sm:gap-x-4 items-center">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 order-1 sm:order-none">
              <div
                className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{
                  background: track.accentColor
                    ? `rgba(${track.accentRgb ?? "125,191,158"}, 0.15)`
                    : "var(--muted)",
                  border: track.accentColor
                    ? `1px solid rgba(${track.accentRgb ?? "125,191,158"}, 0.25)`
                    : "1px solid var(--border)",
                }}
              >
                {track.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={track.coverUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music
                    className="w-4 h-4"
                    style={{ color: track.accentColor ?? "var(--primary)" }}
                    strokeWidth={1.5}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground leading-tight truncate">
                  {track.trackHref ? (
                    <Link
                      href={track.trackHref}
                      className="hover:underline underline-offset-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {track.title}
                    </Link>
                  ) : (
                    track.title
                  )}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
                  {track.artistName ? (
                    track.artistSlug ? (
                      <Link
                        href={`/speu/artists/${track.artistSlug}`}
                        className="min-w-0 flex-1 truncate hover:text-foreground transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {track.artistName}
                      </Link>
                    ) : (
                      <span className="min-w-0 flex-1 truncate">{track.artistName}</span>
                    )
                  ) : (
                    <span className="flex-1" />
                  )}
                  {isPlaying && (
                    <span className="hidden sm:inline-flex items-end gap-0.5 h-3.5 shrink-0">
                      {[1, 2, 3].map((i) => (
                        <motion.span
                          key={i}
                          className="w-0.5 rounded-full"
                          style={{ background: track.accentColor ?? "var(--primary)" }}
                          animate={{ height: ["35%", "100%", "45%", "85%", "35%"] }}
                          transition={{
                            duration: 0.75,
                            repeat: Infinity,
                            delay: i * 0.12,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </span>
                  )}
                  {canSeek && (
                    <span className="flex-shrink-0 font-mono text-[10px] tracking-tight text-muted-foreground/90 hidden sm:inline">
                      {formatPlayerTime(currentTime)} / {formatPlayerTime(duration)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-0.5 sm:gap-1 order-2 sm:order-none px-1">
              <button
                type="button"
                onClick={toggleShuffle}
                disabled={!canShuffle}
                aria-label={
                  shuffleEnabled ? "Выпадковы парадак уключаны" : "Уключыць выпадковы парадак"
                }
                aria-pressed={shuffleEnabled}
                className={cn(
                  ctrlBtn,
                  shuffleEnabled
                    ? "border-primary/50 text-primary bg-primary/12"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                )}
              >
                <Shuffle className="w-4 h-4" strokeWidth={2} />
              </button>

              <button
                type="button"
                onClick={skipPrevious}
                aria-label="Папярэдні трэк"
                className={cn(
                  ctrlBtn,
                  "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                )}
              >
                <SkipBack className="w-4 h-4" strokeWidth={2} />
              </button>

              <button
                type="button"
                onClick={() => togglePlay(track)}
                aria-label={isPlaying ? "Паўза" : "Прайграць"}
                className="w-11 h-11 mx-0.5 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-sm"
                style={{
                  background: track.accentColor ?? "var(--primary)",
                  color: "white",
                }}
              >
                {isPlaying ? (
                  <Pause className="w-[18px] h-[18px]" fill="currentColor" strokeWidth={0} />
                ) : (
                  <Play className="w-[18px] h-[18px] ml-0.5" fill="currentColor" strokeWidth={0} />
                )}
              </button>

              <button
                type="button"
                onClick={skipNext}
                disabled={!canSkipNext}
                aria-label="Наступны трэк"
                className={cn(
                  ctrlBtn,
                  "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                )}
              >
                <SkipForward className="w-4 h-4" strokeWidth={2} />
              </button>

              <button
                type="button"
                onClick={toggleRepeatAll}
                disabled={!queueNav}
                aria-label={
                  repeatAll
                    ? "Адключыць паўтор плэйліста"
                    : "Паўтараць увесь плэйліст"
                }
                aria-pressed={repeatAll}
                className={cn(
                  ctrlBtn,
                  repeatAll
                    ? "border-primary/50 text-primary bg-primary/12"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                )}
              >
                <Repeat className="w-4 h-4" strokeWidth={2} />
              </button>

              <button
                type="button"
                onClick={toggleRepeatOne}
                aria-label={
                  repeatOne
                    ? "Адключыць паўтор трэка"
                    : "Паўтараць адзін трэк"
                }
                aria-pressed={repeatOne}
                className={cn(
                  ctrlBtn,
                  repeatOne
                    ? "border-primary/50 text-primary bg-primary/12"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                )}
              >
                <Repeat1 className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 order-3 sm:order-none">
              {track.trackHref?.startsWith("/speu/tracks/") ? (
                <TrackLikeButton
                  trackId={track.id}
                  size="sm"
                  accentColor={track.accentColor ?? null}
                  className="border-border/60"
                />
              ) : null}
              <button
                type="button"
                onClick={stop}
                aria-label="Спыніць"
                className="w-9 h-9 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
