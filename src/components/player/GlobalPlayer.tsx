"use client";

import Link from "next/link";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from "framer-motion";
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
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { usePlayer, type PlayerTrack } from "@/contexts/PlayerContext";
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
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] flex h-[48%] items-end justify-center gap-[3px] bg-gradient-to-t from-black/45 to-transparent pb-1 pt-5"
      aria-hidden
    >
      {[1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] min-w-[3px] rounded-full"
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
        "pointer-events-none flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-muted-foreground"
      )}
    >
      {isPlaying ? (
        <div className="flex h-[22px] min-w-[30px] items-end justify-center gap-[3px]">
          {[1, 2, 3].map((i) => (
            <motion.span
              key={i}
              className="w-[3px] min-w-[3px] rounded-full"
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
        <Music className="size-[1.12rem] opacity-50" strokeWidth={1.5} />
      )}
    </div>
  );
}

/** Абкладка для каруселі (цэнтр і бакі) */
function MobileSheetCoverArt({ t, className }: { t: PlayerTrack; className?: string }) {
  const rgb = t.accentRgb ?? "125,191,158";
  return (
    <div
      className={cn("relative size-full overflow-hidden bg-muted", className)}
      style={
        t.accentColor
          ? { background: `rgba(${rgb}, 0.12)` }
          : { background: "var(--muted)" }
      }
    >
      {t.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={t.coverUrl} alt="" className="size-full object-cover" draggable={false} />
      ) : (
        <div className="flex size-full items-center justify-center">
          <Music
            className="size-[24%] max-w-10 opacity-55"
            style={{ color: t.accentColor ?? "var(--primary)" }}
            strokeWidth={1.25}
          />
        </div>
      )}
    </div>
  );
}

const CF_SIDE_SCALE = 0.76;
const CF_GAP_PX = 12;
const CF_DRAG_PARALLAX = 0.14;
/** Пасля адпуску — кароткі «докрут» перад skip, каб відаць праезд карты (~150–200ms) */
const CF_COMMIT_MS = 195;
const CF_COMMIT_EASE = [0.22, 1, 0.36, 1] as const;

/** Бакавая квадратная вокладка (cover flow); тап — папярэдні/наступны */
function MobileSheetCoverFlowSide({
  neighbor,
  side,
  onTap,
  className,
}: {
  neighbor: PlayerTrack | null;
  side: "left" | "right";
  onTap: () => void;
  className?: string;
}) {
  const box =
    "relative aspect-square size-[min(54vw,200px)] max-h-[200px] max-w-[200px] overflow-hidden rounded-2xl ring-1 ring-border/35";

  if (!neighbor) {
    return (
      <div
        className={cn(box, "border border-dashed border-border/30 bg-muted/25 opacity-45", className)}
        aria-hidden
      />
    );
  }

  const label =
    side === "left"
      ? `Папярэдні трэк: ${neighbor.title}`
      : `Наступны трэк: ${neighbor.title}`;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onTap();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={label}
      className={cn(
        box,
        "cursor-pointer touch-manipulation outline-none transition-[opacity,transform] hover:opacity-95 active:opacity-100",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 z-[1] rounded-2xl bg-black/22" aria-hidden />
      <MobileSheetCoverArt t={neighbor} className="rounded-2xl" />
    </button>
  );
}

/** Cover flow: цэнтр наперадзе, квадратныя суседзі ззаду; свайп улева — наступны, управа — папярэдні */
function MobileSheetCoverCarousel({
  track,
  prevTrack,
  nextTrack,
  skipToNext,
  skipToPreviousInQueue,
}: {
  track: PlayerTrack;
  prevTrack: PlayerTrack | null;
  nextTrack: PlayerTrack | null;
  skipToNext: () => void;
  skipToPreviousInQueue: () => void;
}) {
  const x = useMotionValue(0);
  const reduceMotion = useReducedMotion();
  const coverMeasureRef = useRef<HTMLDivElement>(null);
  const [coverPx, setCoverPx] = useState(200);

  useLayoutEffect(() => {
    const el = coverMeasureRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => {
      const w = el.offsetWidth;
      if (w > 0) setCoverPx(w);
    };
    const ro = new ResizeObserver(update);
    ro.observe(el);
    queueMicrotask(update);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    x.set(0);
  }, [track.id, x]);

  const canDrag = Boolean(prevTrack || nextTrack);

  const goPrev = useCallback(() => {
    skipToPreviousInQueue();
    x.set(0);
  }, [skipToPreviousInQueue, x]);

  const goNext = useCallback(() => {
    skipToNext();
    x.set(0);
  }, [skipToNext, x]);

  const commitDistanceX = useCallback(() => {
    if (typeof window === "undefined") return 200;
    return Math.min(240, window.innerWidth * 0.34);
  }, []);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const th = 52;
    const vx = info.velocity.x;
    const ox = info.offset.x;
    const vTh = 260;

    const springBack = () =>
      animate(x, 0, { type: "spring", stiffness: 320, damping: 34 });

    const commitDur =
      reduceMotion ? 0.08 : Math.abs(vx) > 420 ? 0.14 : CF_COMMIT_MS / 1000;

    if (ox <= -th || vx < -vTh) {
      if (nextTrack) {
        const target = -commitDistanceX();
        animate(x, target, {
          duration: commitDur,
          ease: CF_COMMIT_EASE,
        }).then(() => goNext());
      } else springBack();
      return;
    }
    if (ox >= th || vx > vTh) {
      if (prevTrack) {
        const target = commitDistanceX();
        animate(x, target, {
          duration: commitDur,
          ease: CF_COMMIT_EASE,
        }).then(() => goPrev());
      } else springBack();
      return;
    }
    springBack();
  };

  const sideOffset = coverPx * (1 + CF_SIDE_SCALE) * 0.5 + CF_GAP_PX;

  /** Бацькоўскі drag рухае сцэну; бакі з паралаксам адносна цэнтра */
  const leftCardX = useTransform(x, (d) => -sideOffset - d * CF_DRAG_PARALLAX);
  const rightCardX = useTransform(x, (d) => sideOffset + d * CF_DRAG_PARALLAX);

  const centerScale = useTransform(x, (d) => {
    const t = Math.min(1, Math.abs(d) / 140);
    return 1 - t * 0.06;
  });
  const leftScale = useTransform(x, (d) => {
    if (d >= 0) return CF_SIDE_SCALE;
    const t = Math.min(1, -d / 130);
    return CF_SIDE_SCALE + t * (1 - CF_SIDE_SCALE);
  });
  const rightScale = useTransform(x, (d) => {
    if (d <= 0) return CF_SIDE_SCALE;
    const t = Math.min(1, d / 130);
    return CF_SIDE_SCALE + t * (1 - CF_SIDE_SCALE);
  });

  const centerRotateY = useTransform(x, (d) => (reduceMotion ? 0 : d * -0.045));
  const leftRotateY = useTransform(x, (d) => (reduceMotion ? 0 : 8 + d * 0.02));
  const rightRotateY = useTransform(x, (d) => (reduceMotion ? 0 : -8 + d * 0.02));

  return (
    <div
      className="relative mx-auto mt-2 w-full max-w-[min(100vw-1rem,380px)] overflow-visible px-1"
      data-sheet-no-gesture
    >
      {/* Затуханне ў колер фону (светлая/цёмная тэма) — на ўсю шырыню экрана, без абрэзу па вертыкалі */}
      <div
        className="pointer-events-none absolute -top-4 -bottom-4 left-1/2 z-[24] w-screen -translate-x-1/2"
        aria-hidden
      >
        <div
          className="absolute inset-y-0 left-0 w-[min(45%,168px)]"
          style={{
            background:
              "linear-gradient(to right, var(--background) 0%, color-mix(in srgb, var(--background) 72%, transparent) 38%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-[min(45%,168px)]"
          style={{
            background:
              "linear-gradient(to left, var(--background) 0%, color-mix(in srgb, var(--background) 72%, transparent) 38%, transparent 100%)",
          }}
        />
      </div>

      <div
        className="relative mx-auto w-full [perspective:1100px]"
        style={{ height: coverPx > 0 ? coverPx : undefined, minHeight: "min(54vw, 200px)" }}
      >
        <div
          ref={coverMeasureRef}
          className="pointer-events-none invisible absolute left-1/2 top-1/2 aspect-square w-[min(54vw,200px)] max-w-[200px] -translate-x-1/2 -translate-y-1/2"
          aria-hidden
        />

        <motion.div
          className="absolute inset-0 [transform-style:preserve-3d]"
          style={{ x }}
          drag={canDrag ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          dragTransition={{ bounceStiffness: 340, bounceDamping: 28 }}
          onDragEnd={onDragEnd}
        >
          <div className="absolute left-1/2 top-1/2 z-[8] -translate-x-1/2 -translate-y-1/2">
            <motion.div
              className="[transform-style:preserve-3d]"
              style={{
                x: leftCardX,
                scale: leftScale,
                rotateY: leftRotateY,
                opacity: prevTrack ? 0.55 : 0.4,
              }}
            >
              <MobileSheetCoverFlowSide neighbor={prevTrack} side="left" onTap={goPrev} />
            </motion.div>
          </div>

          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[16] -translate-x-1/2 -translate-y-1/2">
            <motion.div
              className="aspect-square w-[min(54vw,200px)] max-w-[200px] overflow-hidden rounded-2xl ring-2 ring-background [transform-style:preserve-3d]"
              style={{
                scale: centerScale,
                rotateY: centerRotateY,
                background: track.accentColor
                  ? `rgba(${track.accentRgb ?? "125,191,158"}, 0.1)`
                  : "var(--muted)",
              }}
            >
              <motion.div
                key={track.id}
                className="size-full"
                initial={reduceMotion ? false : { opacity: 0.88, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={
                  reduceMotion
                    ? { duration: 0.18 }
                    : { type: "spring", stiffness: 300, damping: 28 }
                }
              >
                <MobileSheetCoverArt t={track} className="rounded-2xl" />
              </motion.div>
            </motion.div>
          </div>

          <div className="absolute left-1/2 top-1/2 z-[8] -translate-x-1/2 -translate-y-1/2">
            <motion.div
              className="[transform-style:preserve-3d]"
              style={{
                x: rightCardX,
                scale: rightScale,
                rotateY: rightRotateY,
                opacity: nextTrack ? 0.55 : 0.4,
              }}
            >
              <MobileSheetCoverFlowSide neighbor={nextTrack} side="right" onTap={goNext} />
            </motion.div>
          </div>
        </motion.div>
      </div>
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
    skipToPreviousInQueue,
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
      if (dx <= -th || vx < -SHEET_SKIP_VELOCITY) skipNext();
      else if (dx >= th || vx > SHEET_SKIP_VELOCITY) skipToPreviousInQueue();
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
                <div className="flex flex-col items-center gap-1.5 pt-0.5">
                  <div className="h-1 w-10 shrink-0 rounded-full bg-muted-foreground/35" aria-hidden />
                  {/* Месца колькі было ў два радкі падказкі text-[11px] — без тэксту */}
                  <div className="pointer-events-none min-h-[2.125rem] w-full max-w-md shrink-0" aria-hidden />
                </div>

                <MobileSheetCoverCarousel
                  track={track}
                  prevTrack={queueNeighborTracks.prev}
                  nextTrack={queueNeighborTracks.next}
                  skipToNext={skipNext}
                  skipToPreviousInQueue={skipToPreviousInQueue}
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
                    size="lg"
                    accentColor={track.accentColor ?? null}
                    className="min-h-11 min-w-11 !max-h-11 !max-w-11 shrink-0 rounded-full !p-0 hover:bg-muted/45 active:bg-muted/55"
                  />
                ) : (
                  <div
                    className="pointer-events-none min-h-11 min-w-11 shrink-0 opacity-0"
                    aria-hidden
                  />
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
    if (!track) queueMicrotask(() => setMobileSheetOpen(false));
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
            {/* Мабільны плэер: націск на мініяцюру / тэкст / час — шторка; Play і лайк асобна; меню «⋯» толькі на md+ */}
            <div className="flex md:hidden flex-row items-center gap-1.5 min-w-0">
              <button
                type="button"
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-lg py-0.5 text-left outline-none transition-colors hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Адкрыць плэер"
                onClick={() => setMobileSheetOpen(true)}
              >
                <div
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                  style={{
                    background: track.accentColor
                      ? `rgba(${track.accentRgb ?? "125,191,158"}, 0.15)`
                      : "var(--muted)",
                  }}
                >
                  {track.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={track.coverUrl} alt="" className="size-full object-cover" draggable={false} />
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
                  <p className="truncate text-sm font-medium leading-tight text-foreground">
                    {track.title}
                  </p>
                  {track.artistName ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground tabular-nums">
                      {track.artistName}
                    </p>
                  ) : null}
                </div>

                <span
                  className="shrink-0 font-mono text-[10px] tracking-tight text-muted-foreground/90 tabular-nums whitespace-nowrap"
                  aria-live="polite"
                >
                  {formatPlayerTime(currentTime)}
                  <span className="text-muted-foreground/50"> / </span>
                  {duration > 0 ? formatPlayerTime(duration) : "—:—"}
                </span>
              </button>

              {track.trackHref?.startsWith("/speu/tracks/") ? (
                <TrackLikeButton
                  trackId={track.id}
                  size="lg"
                  accentColor={track.accentColor ?? null}
                  className="size-10 !min-h-10 !min-w-10 !max-h-10 !max-w-10 shrink-0 rounded-full !p-0 hover:bg-muted/45 active:bg-muted/55"
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

              <span className="inline-flex size-10 shrink-0 items-center justify-center">
                {track.trackHref?.startsWith("/speu/tracks/") ? (
                  <TrackLikeButton
                    trackId={track.id}
                    size="lg"
                    accentColor={track.accentColor ?? null}
                    className="size-10 !min-h-10 !min-w-10 !max-h-10 !max-w-10 rounded-full !p-0 hover:bg-muted/45 active:bg-muted/55"
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
                  className="inline-flex h-[22px] shrink-0 items-end gap-[3px]"
                  aria-hidden
                >
                  {[1, 2, 3].map((i) => (
                    <motion.span
                      key={i}
                      className="w-[3px] min-w-[3px] rounded-full"
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
