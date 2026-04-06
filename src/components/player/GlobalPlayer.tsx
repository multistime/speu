"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Music, Pause, Play, Repeat1, X } from "lucide-react";
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
  const progress =
    dragRatio !== null ? dragRatio : livePct;
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
        /* Зона націску ніжэй за візуал, лінія — строга top-0 (першы піксель панэлі) */
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

export function GlobalPlayer() {
  const {
    track,
    isPlaying,
    repeatOne,
    currentTime,
    duration,
    canSeek,
    togglePlay,
    toggleRepeatOne,
    stop,
  } = usePlayer();

  return (
    <AnimatePresence>
      {track && (
        <motion.div
          key="global-player"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="group/player fixed bottom-0 inset-x-0 z-50 overflow-visible bg-background/95 backdrop-blur-md"
          style={
            track.accentRgb
              ? { boxShadow: `0 -4px 40px rgba(${track.accentRgb}, 0.08)` }
              : undefined
          }
        >
          <GlobalPlayerProgress track={track} />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
            {/* Icon / cover */}
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
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
                  alt={track.title}
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

            {/* Track info + time (для мінімалізму — толькі на sm+) */}
            <div className="flex-1 min-w-0">
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
                {canSeek && (
                  <span className="flex-shrink-0 font-mono text-[10px] tracking-tight text-muted-foreground/90 hidden sm:inline">
                    {formatPlayerTime(currentTime)} / {formatPlayerTime(duration)}
                  </span>
                )}
              </div>
            </div>

            {/* Equalizer animation when playing */}
            {isPlaying && (
              <div className="hidden sm:flex items-end gap-0.5 h-4 flex-shrink-0">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 rounded-full"
                    style={{ background: track.accentColor ?? "var(--primary)" }}
                    animate={{ height: ["30%", "100%", "50%", "80%", "30%"] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={toggleRepeatOne}
                aria-label={
                  repeatOne
                    ? "Адключыць паўтор трэка"
                    : "Уключыць паўтор аднаго трэка"
                }
                aria-pressed={repeatOne}
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
                  repeatOne
                    ? "border-primary/50 text-primary bg-primary/12"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                <Repeat1 className="w-4 h-4" strokeWidth={2} />
              </button>

              <button
                type="button"
                onClick={() => togglePlay(track)}
                aria-label={isPlaying ? "Паўза" : "Прайграць"}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                style={{
                  background: track.accentColor ?? "var(--primary)",
                  color: "white",
                }}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" fill="currentColor" strokeWidth={0} />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" fill="currentColor" strokeWidth={0} />
                )}
              </button>

              <button
                type="button"
                onClick={stop}
                aria-label="Спыніць"
                className="w-8 h-8 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 flex items-center justify-center transition-colors"
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
