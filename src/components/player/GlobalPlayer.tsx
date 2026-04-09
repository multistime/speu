"use client";

import Link from "next/link";
import { Menu } from "@base-ui/react/menu";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
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
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePlayer, type PlayerRepeatMode, type PlayerTrack } from "@/contexts/PlayerContext";
import { formatPlayerTime } from "@/lib/format-player-time";
import { clientXToSeekRatio } from "@/lib/player-progress";
import { cn } from "@/lib/utils";

function GlobalPlayerProgress({
  track,
  className,
}: {
  track: PlayerTrack;
  /** Напрыклад, для шторкі: relative mt-2 h-3.5 w-full max-w-md mx-auto */
  className?: string;
}) {
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
        "z-30 h-3 cursor-pointer touch-none select-none",
        "absolute inset-x-0 top-0",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/45 focus-visible:outline-offset-2 focus-visible:rounded-sm",
        !canSeek && "cursor-not-allowed",
        className
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

const mobileSheetCtrlBtn =
  "min-h-11 min-w-11 rounded-full border flex items-center justify-center transition-colors shrink-0 disabled:opacity-35 disabled:pointer-events-none";

function MobileNowPlayingSheet({
  open,
  onClose,
  track,
  canShuffle,
  shuffleEnabled,
  canSkipNext,
  repeatLabel,
}: {
  open: boolean;
  onClose: () => void;
  track: PlayerTrack;
  canShuffle: boolean;
  shuffleEnabled: boolean;
  canSkipNext: boolean;
  repeatLabel: string;
}) {
  const {
    isPlaying,
    repeatMode,
    currentTime,
    duration,
    togglePlay,
    cycleRepeatMode,
    toggleShuffle,
    skipNext,
    skipPrevious,
    stop,
  } = usePlayer();

  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [pullDown, setPullDown] = useState(0);
  const pullDownRef = useRef(0);
  const pullStartY = useRef(0);
  const pulling = useRef(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => closeBtnRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const resetPull = useCallback(() => {
    if (pullDownRef.current > 130) onClose();
    pullDownRef.current = 0;
    setPullDown(0);
    pulling.current = false;
  }, [onClose]);

  const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pulling.current = true;
    pullStartY.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pulling.current) return;
    const d = Math.max(0, e.clientY - pullStartY.current);
    pullDownRef.current = d;
    setPullDown(d);
  };

  const onHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    resetPull();
  };

  const swipeThreshold =
    typeof window !== "undefined" ? Math.min(140, window.innerWidth * 0.28) : 100;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            key="mobile-sheet-backdrop"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[55] bg-black/45 backdrop-blur-[2px] md:hidden"
            aria-hidden
            onClick={onClose}
          />
          <motion.div
            key="mobile-sheet-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 34, stiffness: 380 }}
            className="fixed inset-x-0 bottom-0 z-[60] max-h-[min(92dvh,920px)] min-h-[72dvh] md:hidden"
          >
            <div
              style={{ transform: `translate3d(0, ${pullDown}px, 0)` }}
              className="flex max-h-[min(92dvh,920px)] min-h-[72dvh] flex-col rounded-t-[1.35rem] border border-border/50 bg-background shadow-[0_-12px_48px_rgba(0,0,0,0.18)] pb-[max(1rem,env(safe-area-inset-bottom))] pt-1"
            >
            <div className="flex flex-col items-stretch gap-1 px-4 pb-2 pt-1">
              <div
                className="flex cursor-grab touch-none flex-col items-center py-2 active:cursor-grabbing"
                onPointerDown={onHandlePointerDown}
                onPointerMove={onHandlePointerMove}
                onPointerUp={onHandlePointerUp}
                onPointerCancel={onHandlePointerUp}
              >
                <div className="h-1 w-10 shrink-0 rounded-full bg-muted-foreground/35" aria-hidden />
              </div>
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">Зараз гуляе</span>
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={onClose}
                  aria-label="Згарнуць плэер"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40"
                >
                  <ChevronDown className="size-5" strokeWidth={2} />
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pb-6">
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                onDragEnd={(_, info) => {
                  const v = info.velocity.x;
                  if (info.offset.x <= -swipeThreshold || v < -380) skipNext();
                  else if (info.offset.x >= swipeThreshold || v > 380) skipPrevious();
                }}
                className="relative mx-auto mt-1 w-full max-w-[min(78vw,300px)] touch-none"
              >
                <div
                  className="relative aspect-square w-full overflow-hidden rounded-2xl shadow-lg ring-1 ring-border/40"
                  style={{
                    background: track.accentColor
                      ? `rgba(${track.accentRgb ?? "125,191,158"}, 0.12)`
                      : "var(--muted)",
                  }}
                >
                  {track.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={track.coverUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Music
                        className="size-[22%] max-w-[5rem]"
                        style={{ color: track.accentColor ?? "var(--primary)" }}
                        strokeWidth={1.25}
                      />
                    </div>
                  )}
                  {isPlaying ? <GlobalPlayerCoverEqualizer accentColor={track.accentColor} /> : null}
                </div>
                <p className="mt-2 text-center text-[11px] text-muted-foreground/80">
                  Свайп улева — наступны, управа — папярэдні
                </p>
              </motion.div>

              <div className="mt-5 space-y-1 text-center">
                <h2 id={titleId} className="text-balance px-1 text-lg font-semibold leading-snug text-foreground">
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
                </h2>
                {track.artistName ? (
                  <p className="text-sm text-muted-foreground">
                    {track.artistSlug ? (
                      <Link
                        href={`/speu/artists/${track.artistSlug}`}
                        className="hover:text-foreground transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {track.artistName}
                      </Link>
                    ) : (
                      track.artistName
                    )}
                  </p>
                ) : null}
              </div>

              <GlobalPlayerProgress
                track={track}
                className="relative inset-x-auto top-auto z-30 mx-auto mt-6 h-3.5 w-full max-w-md touch-none select-none"
              />

              <div className="mt-2 flex items-center justify-center gap-1 font-mono text-xs tabular-nums text-muted-foreground">
                <span aria-live="polite">
                  {formatPlayerTime(currentTime)}
                  <span className="text-muted-foreground/50"> / </span>
                  {duration > 0 ? formatPlayerTime(duration) : "—:—"}
                </span>
              </div>

              <div className="mt-8 flex items-center justify-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={toggleShuffle}
                  disabled={!canShuffle}
                  aria-label={
                    shuffleEnabled ? "Выпадковы парадак уключаны" : "Уключыць выпадковы парадак"
                  }
                  aria-pressed={shuffleEnabled}
                  className={cn(
                    mobileSheetCtrlBtn,
                    shuffleEnabled
                      ? "border-primary/50 text-primary bg-primary/12"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  )}
                >
                  <Shuffle className="size-[1.15rem]" strokeWidth={2} />
                </button>

                <button
                  type="button"
                  onClick={skipPrevious}
                  aria-label="Папярэдні трэк"
                  className={cn(
                    mobileSheetCtrlBtn,
                    "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  )}
                >
                  <SkipBack className="size-[1.15rem]" strokeWidth={2} />
                </button>

                <button
                  type="button"
                  onClick={() => togglePlay(track)}
                  aria-label={isPlaying ? "Паўза" : "Прайграць"}
                  className="flex min-h-[3.25rem] min-w-[3.25rem] shrink-0 items-center justify-center rounded-full shadow-md transition-transform duration-200 hover:scale-[1.04] active:scale-[0.97]"
                  style={{
                    background: track.accentColor ?? "var(--primary)",
                    color: "white",
                  }}
                >
                  {isPlaying ? (
                    <Pause className="size-7" fill="currentColor" strokeWidth={0} />
                  ) : (
                    <Play className="size-7 ml-1" fill="currentColor" strokeWidth={0} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={skipNext}
                  disabled={!canSkipNext}
                  aria-label="Наступны трэк"
                  className={cn(
                    mobileSheetCtrlBtn,
                    "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  )}
                >
                  <SkipForward className="size-[1.15rem]" strokeWidth={2} />
                </button>

                <button
                  type="button"
                  onClick={cycleRepeatMode}
                  aria-label={repeatLabel}
                  aria-pressed={repeatMode !== "off"}
                  className={cn(
                    mobileSheetCtrlBtn,
                    repeatMode !== "off"
                      ? "border-primary/50 text-primary bg-primary/12"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  )}
                >
                  {repeatMode === "one" ? (
                    <Repeat1 className="size-[1.15rem]" strokeWidth={2} />
                  ) : (
                    <Repeat className="size-[1.15rem]" strokeWidth={2} />
                  )}
                </button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-6 border-t border-border/50 pt-6">
                {track.trackHref?.startsWith("/speu/tracks/") ? (
                  <TrackLikeButton
                    trackId={track.id}
                    size="sm"
                    accentColor={track.accentColor ?? null}
                    className="border-border/60 min-h-11 min-w-11 !max-h-11 !max-w-11 !min-h-11 !min-w-11 shrink-0 rounded-full !p-0 hover:bg-muted/50"
                  />
                ) : (
                  <span className="min-h-11 min-w-11" aria-hidden />
                )}
                <button
                  type="button"
                  onClick={stop}
                  aria-label="Спыніць прайграванне"
                  className={cn(
                    mobileSheetCtrlBtn,
                    "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  )}
                >
                  <X className="size-[1.05rem]" strokeWidth={2} />
                </button>
              </div>
            </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

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

  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  useEffect(() => {
    if (!track) setMobileSheetOpen(false);
  }, [track]);

  return (
    <>
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
            {/* Мабільны плэер: націск на радок (акрамя спасылак і кнопак) — шторка «зараз гуляе» */}
            <div
              className="flex md:hidden flex-row items-center gap-1.5 min-w-0 cursor-pointer"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("a, button")) return;
                setMobileSheetOpen(true);
              }}
            >
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
    {track ? (
      <MobileNowPlayingSheet
        open={mobileSheetOpen}
        onClose={() => setMobileSheetOpen(false)}
        track={track}
        canShuffle={canShuffle}
        shuffleEnabled={shuffleEnabled}
        canSkipNext={canSkipNext}
        repeatLabel={repeatLabel}
      />
    ) : null}
    </>
  );
}
