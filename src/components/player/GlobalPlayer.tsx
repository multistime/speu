"use client";

import Link from "next/link";
import { Menu } from "@base-ui/react/menu";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  type PanInfo,
} from "framer-motion";
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
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePlayer, type PlayerRepeatMode, type PlayerTrack } from "@/contexts/PlayerContext";
import { formatPlayerTime } from "@/lib/format-player-time";
import { clientXToSeekRatio } from "@/lib/player-progress";
import { cn } from "@/lib/utils";

function GlobalPlayerProgress({
  track,
  className,
  layout = "dock",
}: {
  track: PlayerTrack;
  /** Напрыклад, для шторкі: mx-auto mt-3 w-full max-w-md */
  className?: string;
  /** dock — тонкая рэйка ўнізе бару; sheet — высокая зона дотыку, скраб па свайпе */
  layout?: "dock" | "sheet";
}) {
  const { currentTime, duration, canSeek, seekRatio, isPlaying } = usePlayer();

  const railRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragRatio, setDragRatio] = useState<number | null>(null);
  const isSheet = layout === "sheet";

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

  const fillDockClass = cn(
    "pointer-events-none absolute left-0 top-0 z-[1] h-px origin-left transition-[opacity,box-shadow]",
    !track.accentColor && "bg-primary",
    isDragging
      ? "opacity-100 shadow-[0_0_10px_rgba(125,191,158,0.2)]"
      : "opacity-[0.95] group-hover/player:opacity-100"
  );

  const thumbDockClass = cn(
    "pointer-events-none absolute top-0 z-[2] size-[5px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] border border-background/80 shadow-[0_0_6px_rgba(0,0,0,0.35)] transition-transform duration-150 ease-out",
    !track.accentColor && "bg-primary",
    "group-hover/player:scale-110",
    isDragging && "scale-125 ring-1 ring-primary/40"
  );

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
      data-sheet-no-gesture
      className={cn(
        "z-30 cursor-pointer touch-none select-none",
        isSheet
          ? "relative min-h-12 w-full rounded-lg"
          : "h-3 absolute inset-x-0 top-0",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/45 focus-visible:outline-offset-2 focus-visible:rounded-sm",
        !canSeek && "cursor-not-allowed",
        className
      )}
    >
      {canSeek ? (
        isSheet ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 h-7 -translate-y-1/2 px-0.5"
            aria-hidden
          >
            <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-muted/70" />
            <div
              className={cn(
                "absolute left-0 top-1/2 z-[1] h-2 -translate-y-1/2 rounded-full transition-[opacity,box-shadow]",
                !track.accentColor && "bg-primary",
                isDragging ? "opacity-100 shadow-[0_0_12px_rgba(125,191,158,0.25)]" : "opacity-95"
              )}
              style={{
                width: `${pct}%`,
                ...fillStyle,
              }}
            />
            <div
              className={cn(
                "absolute top-1/2 z-[2] size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow-md transition-transform duration-150 ease-out",
                !track.accentColor && "bg-primary",
                isDragging && "scale-110 ring-2 ring-primary/35"
              )}
              style={{
                left: `${pct}%`,
                ...fillStyle,
              }}
            />
          </div>
        ) : (
          <>
            <div
              className={fillDockClass}
              style={{
                width: `${pct}%`,
                ...fillStyle,
              }}
              aria-hidden
            />
            <div
              aria-hidden
              className={thumbDockClass}
              style={{
                left: `${pct}%`,
                ...fillStyle,
              }}
            />
          </>
        )
      ) : (
        <div
          className={cn(
            "pointer-events-none absolute z-[1] overflow-hidden",
            isSheet
              ? "inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-muted/50"
              : "inset-x-0 top-0 h-px"
          )}
          aria-hidden
        >
          {isPlaying ? (
            <div
              className={cn(
                "speu-player-progress-indeterminate h-full w-[22%]",
                track.accentColor ? "" : "bg-primary/75",
                isSheet && "rounded-full"
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

const SHEET_GESTURE_LOCK_PX = 12;
const SHEET_DISMISS_PULL_PX = 118;
const SHEET_SKIP_MIN_DX = 56;
const SHEET_SKIP_VELOCITY = 0.42;

function MobileSheetArtistLine({
  track,
  onNavigate,
}: {
  track: PlayerTrack;
  onNavigate: () => void;
}) {
  if (track.navArtists && track.navArtists.length > 0) {
    return (
      <p className="flex flex-wrap items-center justify-center gap-x-0.5 gap-y-0.5 px-1 text-center text-sm leading-snug text-muted-foreground">
        {track.navArtists.map((a, i) => (
          <span key={a.slug} className="inline-flex items-center">
            {i > 0 ? <span className="text-muted-foreground/45">, </span> : null}
            <Link
              href={`/speu/artists/${a.slug}`}
              onClick={() => onNavigate()}
              className="rounded-sm underline-offset-2 hover:text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40"
            >
              {a.name}
            </Link>
          </span>
        ))}
      </p>
    );
  }
  if (track.artistName) {
    return (
      <p className="px-1 text-center text-sm leading-snug text-muted-foreground">
        {track.artistSlug ? (
          <Link
            href={`/speu/artists/${track.artistSlug}`}
            onClick={() => onNavigate()}
            className="rounded-sm underline-offset-2 hover:text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40"
          >
            {track.artistName}
          </Link>
        ) : (
          track.artistName
        )}
      </p>
    );
  }
  return null;
}

function MobileSheetEqBadge({
  isPlaying,
  accentColor,
}: {
  isPlaying: boolean;
  accentColor?: string | null;
}) {
  const color = accentColor ?? "var(--primary)";
  return (
    <div
      aria-hidden
      className={cn(
        mobileSheetCtrlBtn,
        "pointer-events-none border-border/55 bg-muted/25 text-muted-foreground"
      )}
    >
      {isPlaying ? (
        <div className="flex h-[18px] items-end justify-center gap-0.5">
          {[1, 2, 3].map((i) => (
            <motion.span
              key={i}
              className="w-0.5 rounded-full"
              style={{ background: color }}
              animate={{ height: ["32%", "100%", "38%", "88%", "32%"] }}
              transition={{
                duration: 0.75,
                repeat: Infinity,
                delay: i * 0.12,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      ) : (
        <Music className="size-[1.05rem] opacity-45" strokeWidth={1.5} />
      )}
    </div>
  );
}

function MobileSheetSideCoverPeek({
  neighbor,
  side,
}: {
  neighbor: PlayerTrack | null;
  side: "left" | "right";
}) {
  const wClass = "h-[min(42vw,158px)] w-[17%] max-w-[76px] shrink-0";
  if (!neighbor) {
    return <div className={cn(wClass, "shrink-0")} aria-hidden />;
  }
  return (
    <div
      className={cn(
        wClass,
        "relative overflow-hidden rounded-xl opacity-[0.5] shadow-sm ring-1 ring-border/40",
        side === "left" ? "origin-right scale-[0.9]" : "origin-left scale-[0.9]"
      )}
      aria-hidden
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-[1]",
          side === "left"
            ? "bg-gradient-to-r from-transparent via-background/25 to-background/90"
            : "bg-gradient-to-l from-transparent via-background/25 to-background/90"
        )}
      />
      {neighbor.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={neighbor.coverUrl} alt="" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center bg-muted">
          <Music className="size-[22%] max-w-8 text-muted-foreground/50" strokeWidth={1.25} />
        </div>
      )}
    </div>
  );
}

function MobileSheetCoverCarousel({
  track,
  prevTrack,
  nextTrack,
  skipNext,
  skipPrevious,
}: {
  track: PlayerTrack;
  prevTrack: PlayerTrack | null;
  nextTrack: PlayerTrack | null;
  skipNext: () => void;
  skipPrevious: () => void;
}) {
  const x = useMotionValue(0);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    x.set(0);
  }, [track.id, x]);

  const canDrag = Boolean(prevTrack || nextTrack);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const th = 52;
    const vx = info.velocity.x;
    const ox = info.offset.x;
    const w = rowRef.current?.offsetWidth ?? 300;
    const slide = Math.min(140, w * 0.32);

    if ((ox <= -th || vx < -300) && prevTrack) {
      animate(x, -slide, {
        duration: 0.22,
        ease: [0.32, 0.72, 0, 1],
        onComplete: () => {
          skipPrevious();
          x.set(0);
        },
      });
      return;
    }
    if ((ox >= th || vx > 300) && nextTrack) {
      animate(x, slide, {
        duration: 0.22,
        ease: [0.32, 0.72, 0, 1],
        onComplete: () => {
          skipNext();
          x.set(0);
        },
      });
      return;
    }
    animate(x, 0, { type: "spring", stiffness: 440, damping: 36 });
  };

  return (
    <div
      ref={rowRef}
      className="mx-auto mt-2 flex w-full max-w-[min(100vw-1.75rem,400px)] items-center justify-center gap-1 px-0.5"
      data-sheet-no-gesture
    >
      <MobileSheetSideCoverPeek neighbor={prevTrack} side="left" />
      <motion.div
        style={{
          x,
          background: track.accentColor
            ? `rgba(${track.accentRgb ?? "125,191,158"}, 0.12)`
            : "var(--muted)",
        }}
        drag={canDrag ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        dragTransition={{ bounceStiffness: 380, bounceDamping: 22 }}
        onDragEnd={onDragEnd}
        className="relative aspect-square w-[min(54vw,200px)] shrink-0 overflow-hidden rounded-xl shadow-lg ring-2 ring-background"
      >
        <motion.div
          key={track.id}
          className="size-full"
          initial={{ opacity: 0.65, scale: 0.96, filter: "blur(5px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
        >
          {track.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={track.coverUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Music
                className="size-[20%] max-w-[4rem]"
                style={{ color: track.accentColor ?? "var(--primary)" }}
                strokeWidth={1.25}
              />
            </div>
          )}
        </motion.div>
      </motion.div>
      <MobileSheetSideCoverPeek neighbor={nextTrack} side="right" />
    </div>
  );
}

function MobileNowPlayingSheet({
  open,
  onClose,
  track,
  canShuffle,
  shuffleEnabled,
  repeatLabel,
}: {
  open: boolean;
  onClose: () => void;
  track: PlayerTrack;
  canShuffle: boolean;
  shuffleEnabled: boolean;
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
    queueNeighborTracks,
  } = usePlayer();

  const titleId = useId();
  const playBtnRef = useRef<HTMLButtonElement>(null);
  const [pullDown, setPullDown] = useState(0);
  const pullDownRef = useRef(0);
  const gestureRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    mode: "undecided" | "vertical" | "horizontal";
    lastX: number;
    lastT: number;
  } | null>(null);

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
    const id = requestAnimationFrame(() => playBtnRef.current?.focus());
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

  const finishVerticalPull = useCallback(() => {
    if (pullDownRef.current > SHEET_DISMISS_PULL_PX) onClose();
    pullDownRef.current = 0;
    setPullDown(0);
  }, [onClose]);

  const skipThresholdX = useCallback(() => {
    if (typeof window === "undefined") return SHEET_SKIP_MIN_DX;
    return Math.max(SHEET_SKIP_MIN_DX, Math.min(112, window.innerWidth * 0.2));
  }, []);

  const onSheetGesturePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("a, button, [data-sheet-no-gesture]")) return;
    gestureRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      mode: "undecided",
      lastX: e.clientX,
      lastT: typeof performance !== "undefined" ? performance.now() : Date.now(),
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onSheetGesturePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    if (!g || e.pointerId !== g.pointerId) return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (g.mode === "undecided") {
      if (adx < SHEET_GESTURE_LOCK_PX && ady < SHEET_GESTURE_LOCK_PX) return;
      if (ady >= adx && dy > 0) g.mode = "vertical";
      else if (adx > ady) g.mode = "horizontal";
      else if (dy > 0) g.mode = "vertical";
      else g.mode = "horizontal";
    }

    if (g.mode === "vertical") {
      const d = Math.max(0, dy);
      pullDownRef.current = d;
      setPullDown(d);
    }

    g.lastX = e.clientX;
    g.lastT = now;
  };

  const onSheetGesturePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    if (!g || e.pointerId !== g.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (g.mode === "vertical") {
      finishVerticalPull();
    } else if (g.mode === "horizontal") {
      const dx = e.clientX - g.startX;
      const dt = Math.max(
        1,
        (typeof performance !== "undefined" ? performance.now() : Date.now()) - g.lastT
      );
      const vx = (e.clientX - g.lastX) / dt;
      const th = skipThresholdX();
      if (dx <= -th || vx < -SHEET_SKIP_VELOCITY) skipPrevious();
      else if (dx >= th || vx > SHEET_SKIP_VELOCITY) skipNext();
    }

    gestureRef.current = null;
  };

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
            className="fixed inset-x-0 bottom-0 z-[60] max-h-[88dvh] md:hidden"
          >
            <div
              style={{ transform: `translate3d(0, ${pullDown}px, 0)` }}
              className="flex max-h-[88dvh] flex-col overflow-hidden rounded-t-[1.25rem] border border-border/50 bg-background shadow-[0_-12px_48px_rgba(0,0,0,0.18)] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-0.5"
            >
              <div
                className="touch-none px-4 pb-1 pt-1"
                onPointerDown={onSheetGesturePointerDown}
                onPointerMove={onSheetGesturePointerMove}
                onPointerUp={onSheetGesturePointerEnd}
                onPointerCancel={onSheetGesturePointerEnd}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <div className="h-1 w-10 shrink-0 rounded-full bg-muted-foreground/35" aria-hidden />
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Зараз гуляе · уніз — згарнуць, улева/управа — трэкі
                  </span>
                </div>

                <MobileSheetCoverCarousel
                  track={track}
                  prevTrack={queueNeighborTracks.prev}
                  nextTrack={queueNeighborTracks.next}
                  skipNext={skipNext}
                  skipPrevious={skipPrevious}
                />

                <div className="mt-2.5 space-y-1">
                  <h2
                    id={titleId}
                    className="text-center text-balance text-base font-semibold leading-tight text-foreground"
                  >
                    {track.trackHref ? (
                      <Link
                        href={track.trackHref}
                        onClick={() => onClose()}
                        className="rounded-sm underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40"
                      >
                        {track.title}
                      </Link>
                    ) : (
                      track.title
                    )}
                  </h2>
                  <MobileSheetArtistLine track={track} onNavigate={onClose} />
                </div>

                <div className="mt-2 flex justify-center font-mono text-[11px] tabular-nums text-muted-foreground">
                  <span aria-live="polite">
                    {formatPlayerTime(currentTime)}
                    <span className="text-muted-foreground/50"> / </span>
                    {duration > 0 ? formatPlayerTime(duration) : "—:—"}
                  </span>
                </div>
              </div>

              <div className="shrink-0 px-4">
                <GlobalPlayerProgress
                  track={track}
                  layout="sheet"
                  className="mx-auto w-full max-w-md"
                />
              </div>

              <div
                className="mt-auto flex shrink-0 items-center justify-between gap-2 px-2 pb-1 pt-3"
                data-sheet-no-gesture
              >
                <MobileSheetEqBadge isPlaying={isPlaying} accentColor={track.accentColor} />
                <div className="flex flex-1 items-center justify-center gap-3">
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
                    <Shuffle className="size-[1.1rem]" strokeWidth={2} />
                  </button>

                  <button
                    ref={playBtnRef}
                    type="button"
                    onClick={() => togglePlay(track)}
                    aria-label={isPlaying ? "Паўза" : "Прайграць"}
                    className="flex min-h-[3.1rem] min-w-[3.1rem] shrink-0 items-center justify-center rounded-full shadow-md transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
                    style={{
                      background: track.accentColor ?? "var(--primary)",
                      color: "white",
                    }}
                  >
                    {isPlaying ? (
                      <Pause className="size-6" fill="currentColor" strokeWidth={0} />
                    ) : (
                      <Play className="size-6 ml-0.5" fill="currentColor" strokeWidth={0} />
                    )}
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
                      <Repeat1 className="size-[1.1rem]" strokeWidth={2} />
                    ) : (
                      <Repeat className="size-[1.1rem]" strokeWidth={2} />
                    )}
                  </button>
                </div>
                {track.trackHref?.startsWith("/speu/tracks/") ? (
                  <TrackLikeButton
                    trackId={track.id}
                    size="sm"
                    accentColor={track.accentColor ?? null}
                    className="border-border/60 min-h-11 min-w-11 !max-h-11 !max-w-11 !min-h-11 !min-w-11 shrink-0 rounded-full !p-0 hover:bg-muted/50"
                  />
                ) : (
                  <div className={cn(mobileSheetCtrlBtn, "pointer-events-none border-transparent opacity-0")} aria-hidden />
                )}
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
        repeatLabel={repeatLabel}
      />
    ) : null}
    </>
  );
}
