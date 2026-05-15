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
import { Music, Pause, Play, Repeat, Repeat1, Shuffle } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { TrackLikeButton } from "@/components/speu/TrackLikeButton";
import { GlobalPlayerProgress } from "@/components/player/player-dock-progress";
import { usePlayer, type PlayerTrack } from "@/contexts/PlayerContext";
import { useSpeuMobileChrome } from "@/contexts/SpeuMobileChromeContext";
import { useUiAccent } from "@/contexts/UiAccentContext";
import { formatPlayerTime } from "@/lib/format-player-time";
import { cn } from "@/lib/utils";

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

function MobileSheetEqBadge({ isPlaying }: { isPlaying: boolean }) {
  const { accentColor } = useUiAccent();
  const color = accentColor || "var(--primary)";
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
  const { accentColor, accentRgb } = useUiAccent();
  const rgb = accentRgb.replace(/\s/g, "");
  return (
    <div
      className={cn("relative size-full overflow-hidden bg-muted", className)}
      style={{ background: `rgba(${rgb}, 0.12)` }}
    >
      {t.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={t.coverUrl} alt="" className="size-full object-cover" draggable={false} />
      ) : (
        <div className="flex size-full items-center justify-center">
          <Music
            className="size-[24%] max-w-10 opacity-55"
            style={{ color: accentColor }}
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
  const { accentRgb } = useUiAccent();
  const rgbCompact = accentRgb.replace(/\s/g, "");
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
                background: `rgba(${rgbCompact}, 0.1)`,
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

export function MobileNowPlayingSheet({
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
  const { showBottomNav, mobileViewport } = useSpeuMobileChrome();
  /** Мабільная шторка: адзіны кантракт mobile+standalone з кантэксту. */
  const useMobileMiniChrome = mobileViewport;
  /** Ніз шторкі = толькі вышыня таб-бара, каб шторка накрывала mini-dock і выходзіла "ад меню". */
  const sheetBottomInset = showBottomNav ? "var(--speu-mobile-bottom-nav)" : "0px";

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
  const { accentColor } = useUiAccent();

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
            className={cn(
              "fixed left-0 right-0 top-0 z-[85] bg-black/45 backdrop-blur-[2px]",
              !useMobileMiniChrome && "hidden",
            )}
            style={{ bottom: sheetBottomInset }}
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
            className={cn(
              "fixed inset-x-0 z-[90] max-h-[88dvh]",
              !useMobileMiniChrome && "hidden",
            )}
            style={{ bottom: sheetBottomInset }}
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
                <GlobalPlayerProgress layout="sheet" className="mx-auto w-full max-w-md" />
              </div>

              <div
                className="mt-auto flex shrink-0 items-center justify-between gap-2 px-2 pb-1 pt-3"
                data-sheet-no-gesture
              >
                <MobileSheetEqBadge isPlaying={isPlaying} />
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
                      background: accentColor,
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

