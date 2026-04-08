"use client";

import Link from "next/link";
import { Menu } from "@base-ui/react/menu";
import { AnimatePresence, motion } from "framer-motion";
import {
  Music,
  MoreHorizontal,
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
import { usePlayer, type PlayerRepeatMode, type PlayerTrack } from "@/contexts/PlayerContext";
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

function GlobalPlayerCoverEqualizer({ accentColor }: { accentColor: string | null | undefined }) {
  const color = accentColor ?? "rgba(255,255,255,0.92)";
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] flex h-[48%] items-end justify-center gap-0.5 bg-gradient-to-t from-black/45 to-transparent pb-1 pt-5"
      aria-hidden
    >
      {[1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="w-0.5 rounded-full"
          style={{ background: color }}
          animate={{ height: ["35%", "100%", "45%", "85%", "35%"] }}
          transition={{
            duration: 0.75,
            repeat: Infinity,
            delay: i * 0.12,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

const overflowItemClass =
  "flex cursor-pointer items-center rounded-md px-3 py-2.5 text-sm text-foreground outline-none select-none data-highlighted:bg-muted";

function GlobalPlayerOverflowMenu({
  canShuffle,
  shuffleEnabled,
  toggleShuffle,
  skipNext,
  canSkipNext,
  skipPrevious,
  cycleRepeatMode,
  repeatMode,
  queueNav,
  stop,
}: {
  canShuffle: boolean;
  shuffleEnabled: boolean;
  toggleShuffle: () => void;
  skipNext: () => void;
  canSkipNext: boolean;
  skipPrevious: () => void;
  cycleRepeatMode: () => void;
  repeatMode: PlayerRepeatMode;
  queueNav: boolean;
  stop: () => void;
}) {
  const repeatLine =
    !queueNav
      ? repeatMode === "off"
        ? "Паўтар аднаго: выкл"
        : "Паўтар аднаго: укл"
      : repeatMode === "off"
        ? "Паўтар: выкл"
        : repeatMode === "all"
          ? "Паўтар: уся чарга"
          : "Паўтар: адзін трэк";

  return (
    <div className="relative shrink-0" onPointerDown={(e) => e.stopPropagation()}>
      <Menu.Root modal={false}>
        <Menu.Trigger
          type="button"
          aria-label="Дадаткова"
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors",
            "hover:border-foreground/30 hover:text-foreground",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40"
          )}
        >
          <MoreHorizontal className="size-4" strokeWidth={2} />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner side="top" sideOffset={8} align="end" className="z-[60]">
            <Menu.Popup className="min-w-[13rem] rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none">
              <Menu.Item className={overflowItemClass} onClick={skipPrevious}>
                Папярэдні трэк
              </Menu.Item>
              <Menu.Item
                className={cn(overflowItemClass, !canSkipNext && "pointer-events-none opacity-40")}
                onClick={() => {
                  if (canSkipNext) skipNext();
                }}
              >
                Наступны трэк
              </Menu.Item>
              <Menu.Item
                className={cn(overflowItemClass, !canShuffle && "pointer-events-none opacity-40")}
                onClick={() => {
                  if (canShuffle) toggleShuffle();
                }}
              >
                {shuffleEnabled ? "Выпадковы парадак (уваход)" : "Выпадковы парадак"}
              </Menu.Item>
              <Menu.Item className={overflowItemClass} onClick={cycleRepeatMode}>
                {repeatLine}
              </Menu.Item>
              <Menu.Item className={overflowItemClass} onClick={stop}>
                Спыніць плэер
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}

const ctrlBtn =
  "w-9 h-9 rounded-full border flex items-center justify-center transition-colors shrink-0 disabled:opacity-35 disabled:pointer-events-none";

export function GlobalPlayer() {
  const {
    track,
    isPlaying,
    repeatMode,
    shuffleEnabled,
    nonStopActive,
    queueSize,
    currentTime,
    duration,
    togglePlay,
    cycleRepeatMode,
    toggleShuffle,
    skipNext,
    skipPrevious,
    stop,
  } = usePlayer();

  const queueNav = nonStopActive && queueSize > 0;
  const canShuffle = queueNav && queueSize > 1;
  const canSkipNext = queueNav;

  const repeatLabel = !queueNav
    ? repeatMode === "off"
      ? "Паўтор выклучаны. Націсніце — паўтор аднаго трэка"
      : "Паўтор аднаго трэка. Націсніце — выключыць паўтор"
    : repeatMode === "off"
      ? "Паўтор выклучаны. Націсніце — паўтор усяго плэйліста"
      : repeatMode === "all"
        ? "Паўтор усяго плэйліста. Націсніце — паўтор аднаго трэка"
        : "Паўтор аднаго трэка. Націсніце — выключыць паўтор";

  return (
    <AnimatePresence>
      {track && (
        <motion.div
          key="global-player"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="group/player fixed bottom-0 inset-x-0 z-50 overflow-visible bg-background/95 backdrop-blur-md border-t border-border/40 pt-3"
          style={
            track.accentRgb
              ? { boxShadow: `0 -4px 40px rgba(${track.accentRgb}, 0.08)` }
              : undefined
          }
        >
          <GlobalPlayerProgress track={track} />

          <div className="max-w-7xl mx-auto px-2 sm:px-6 py-2.5 sm:py-3 min-h-[3.25rem]">
            {/* Мабільны плэер: вокладка + метаданыя, час / лайк / прайграванне, меню «⋯» */}
            <div className="flex md:hidden flex-row items-center gap-1.5 min-w-0">
              <div
                className="relative w-10 h-10 shrink-0 overflow-hidden rounded-lg flex items-center justify-center"
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
                  <img src={track.coverUrl} alt="" className="size-full object-cover" />
                ) : (
                  <Music
                    className="w-4 h-4"
                    style={{ color: track.accentColor ?? "var(--primary)" }}
                    strokeWidth={1.5}
                  />
                )}
                {isPlaying ? <GlobalPlayerCoverEqualizer accentColor={track.accentColor} /> : null}
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
                <div className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-muted-foreground tabular-nums">
                  {track.artistName ? (
                    track.artistSlug ? (
                      <Link
                        href={`/speu/artists/${track.artistSlug}`}
                        className="min-w-0 truncate hover:text-foreground transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {track.artistName}
                      </Link>
                    ) : (
                      <span className="min-w-0 truncate">{track.artistName}</span>
                    )
                  ) : null}
                </div>
              </div>

              <span
                className="shrink-0 font-mono text-[10px] tracking-tight text-muted-foreground/90 tabular-nums whitespace-nowrap"
                aria-live="polite"
              >
                {formatPlayerTime(currentTime)}
                <span className="text-muted-foreground/50"> / </span>
                {duration > 0 ? formatPlayerTime(duration) : "—:—"}
              </span>

              {track.trackHref?.startsWith("/speu/tracks/") ? (
                <TrackLikeButton
                  trackId={track.id}
                  size="sm"
                  accentColor={track.accentColor ?? null}
                  className="border-border/60 size-9 !min-h-9 !min-w-9 !max-h-9 !max-w-9 shrink-0 rounded-full !p-0 hover:bg-muted/50"
                />
              ) : null}

              <button
                type="button"
                onClick={() => togglePlay(track)}
                aria-label={isPlaying ? "Паўза" : "Прайграць"}
                className="flex size-10 shrink-0 items-center justify-center rounded-full shadow-sm transition-transform duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: track.accentColor ?? "var(--primary)",
                  color: "white",
                }}
              >
                {isPlaying ? (
                  <Pause className="size-[17px]" fill="currentColor" strokeWidth={0} />
                ) : (
                  <Play className="size-[17px] ml-0.5" fill="currentColor" strokeWidth={0} />
                )}
              </button>

              <GlobalPlayerOverflowMenu
                canShuffle={canShuffle}
                shuffleEnabled={shuffleEnabled}
                toggleShuffle={toggleShuffle}
                skipNext={skipNext}
                canSkipNext={canSkipNext}
                skipPrevious={skipPrevious}
                cycleRepeatMode={cycleRepeatMode}
                repeatMode={repeatMode}
                queueNav={queueNav}
                stop={stop}
              />
            </div>

            <div className="hidden md:flex flex-row items-center gap-4 min-h-[3.25rem] w-full">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
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
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground tabular-nums min-w-0">
                  {track.artistName ? (
                    track.artistSlug ? (
                      <Link
                        href={`/speu/artists/${track.artistSlug}`}
                        className="min-w-0 truncate hover:text-foreground transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {track.artistName}
                      </Link>
                    ) : (
                      <span className="min-w-0 truncate">{track.artistName}</span>
                    )
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-center gap-0.5 sm:gap-1 px-0.5 sm:px-1">
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
                onClick={cycleRepeatMode}
                aria-label={repeatLabel}
                aria-pressed={repeatMode !== "off"}
                className={cn(
                  ctrlBtn,
                  repeatMode !== "off"
                    ? "border-primary/50 text-primary bg-primary/12"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                )}
              >
                {repeatMode === "one" ? (
                  <Repeat1 className="w-4 h-4" strokeWidth={2} />
                ) : (
                  <Repeat className="w-4 h-4" strokeWidth={2} />
                )}
              </button>

              <span className="inline-flex size-9 shrink-0 items-center justify-center">
                {track.trackHref?.startsWith("/speu/tracks/") ? (
                  <TrackLikeButton
                    trackId={track.id}
                    size="sm"
                    accentColor={track.accentColor ?? null}
                    className="border-border/60 size-9 !min-h-9 !min-w-9 !max-h-9 !max-w-9 rounded-full !p-0 hover:bg-muted/50"
                  />
                ) : null}
              </span>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
              <span
                className="font-mono text-[10px] sm:text-[11px] tracking-tight text-muted-foreground/90 tabular-nums whitespace-nowrap shrink-0 min-w-[7.25rem] text-right sm:min-w-[7.75rem]"
                aria-live="polite"
              >
                {formatPlayerTime(currentTime)} /{" "}
                {duration > 0 ? formatPlayerTime(duration) : "—:—"}
              </span>

              {isPlaying ? (
                <span
                  className="inline-flex h-4 shrink-0 items-end gap-0.5"
                  aria-hidden
                >
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
              ) : null}

              <button
                type="button"
                onClick={stop}
                aria-label="Спыніць"
                className="w-9 h-9 shrink-0 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
