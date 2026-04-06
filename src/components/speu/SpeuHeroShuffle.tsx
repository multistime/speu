"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import type { PlayerTrack } from "@/contexts/PlayerContext";
import { cn } from "@/lib/utils";

const SPIN_DURATION_SEC = 44;

const GROOVE_MAX_R = 49.15;

/**
 * Невялікія разрывы ў бороздах (≈2.5–3.5% акружнасьці) — пры кручэньні вока ловіць рух.
 * Патэрн і зсув розныя для кожнага кола, каб разрывы не «стаялі ў шэраг».
 */
function grooveDashPattern(r: number, ringIndex: number): { dasharray: string; dashoffset: number } {
  const C = 2 * Math.PI * r;
  const gapCount = 3 + (ringIndex % 2);
  const totalGap = C * (0.026 + (ringIndex % 3) * 0.002);
  const gapWeights = Array.from({ length: gapCount }, (_, i) => {
    const w = 0.55 + (((ringIndex * 7 + i * 11) % 13) / 13) * 0.55;
    return w;
  });
  const gw = gapWeights.reduce((a, b) => a + b, 0);
  const gaps = gapWeights.map((w) => (w / gw) * totalGap);
  const dashBudget = C - totalGap;
  const dashCount = gapCount + 1;
  const dashWeights = Array.from({ length: dashCount }, (_, i) => {
    return 0.72 + (((ringIndex * 3 + i * 19) % 17) / 17) * 0.48;
  });
  const dw = dashWeights.reduce((a, b) => a + b, 0);
  const dashes = dashWeights.map((w) => (w / dw) * dashBudget);
  const parts: number[] = [];
  for (let i = 0; i < gapCount; i++) {
    parts.push(dashes[i], gaps[i]);
  }
  parts.push(dashes[gapCount]);
  const sum = parts.reduce((a, b) => a + b, 0);
  const drift = C - sum;
  parts[parts.length - 1] += drift;
  const dasharray = parts.map((n) => n.toFixed(2)).join(" ");
  const dashoffset = ((ringIndex * 41 + 17) % 73) * 0.35 * r;
  return { dasharray, dashoffset };
}

const GROOVE_LAYERS = [
  { sizePct: 100, opacity: 0.42, strokeWidth: 0.92 },
  { sizePct: 92, opacity: 0.32, strokeWidth: 0.52 },
  { sizePct: 84, opacity: 0.26, strokeWidth: 0.48 },
  { sizePct: 76, opacity: 0.21, strokeWidth: 0.45 },
  { sizePct: 68, opacity: 0.17, strokeWidth: 0.42 },
  { sizePct: 60, opacity: 0.14, strokeWidth: 0.4 },
] as const;

const DASHED_GROOVES = GROOVE_LAYERS.map((layer, i) => {
  const r = (layer.sizePct / 100) * GROOVE_MAX_R;
  const { dasharray, dashoffset } = grooveDashPattern(r, i);
  return { ...layer, r, dasharray, dashoffset };
});

/** key на бацьку скідвае стан — без useEffect; падложка primary хавае «шэры» перад load */
function SpeuHeroCoverImage({ src, reduceMotion }: { src: string; reduceMotion: boolean }) {
  const [ready, setReady] = useState(false);
  return (
    <div className="absolute inset-0 bg-primary">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="eager"
        decoding="async"
        fetchPriority="high"
        onLoad={() => setReady(true)}
        onError={() => setReady(true)}
        className={cn(
          "absolute inset-0 size-full object-cover",
          !reduceMotion && "transition-opacity duration-300 ease-out",
          ready ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}

type SpeuHeroShuffleProps = {
  tracks: PlayerTrack[];
  playableCount: number;
};

export function SpeuHeroShuffle({ tracks, playableCount }: SpeuHeroShuffleProps) {
  const { startNonStopShuffle, nonStopActive, isPlaying, track, togglePlay } = usePlayer();
  const reduceMotion = useReducedMotion();
  const heroActive = nonStopActive && track && tracks.some((t) => t.id === track.id);

  const spinning = Boolean(heroActive && isPlaying && !reduceMotion);
  const spinTransition = spinning
    ? { duration: SPIN_DURATION_SEC, repeat: Infinity, ease: "linear" as const }
    : { duration: 0.6 };

  const showCover = Boolean(heroActive && track?.coverUrl);
  const labelMotionReduced = reduceMotion
    ? { duration: 0.12 }
    : { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const };

  const onMainClick = () => {
    if (playableCount === 0) return;
    if (heroActive && track) {
      togglePlay(track);
      return;
    }
    startNonStopShuffle(tracks);
  };

  const discClassName = "relative flex size-full items-center justify-center";

  const discInner = (
    <>
      <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_28px_rgba(0,0,0,0.22)]">
        <svg
          className="absolute inset-0 size-full text-primary"
          viewBox="0 0 100 100"
          aria-hidden
        >
          {DASHED_GROOVES.map(({ r, dasharray, dashoffset, opacity, strokeWidth }, i) => (
            <circle
              key={i}
              cx={50}
              cy={50}
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={{ opacity }}
            />
          ))}
        </svg>
      </div>

      <motion.button
        type="button"
        disabled={playableCount === 0}
        onClick={onMainClick}
        whileHover={{ scale: playableCount ? 1.04 : 1 }}
        whileTap={{ scale: playableCount ? 0.97 : 1 }}
        className={cn(
          "group relative z-10 flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-lg sm:size-28",
          "border border-primary/25 disabled:cursor-not-allowed disabled:opacity-40",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary/50",
          !showCover && "bg-primary text-primary-foreground"
        )}
        aria-label={
          playableCount === 0
            ? "Няма трэкаў для прайгравання"
            : heroActive && isPlaying
              ? "Паўза"
              : "Слухаць каталог перамешана без перапынку"
        }
      >
        <AnimatePresence mode="wait">
          {showCover && track?.coverUrl ? (
            <motion.div
              key={track.id}
              className="absolute inset-0"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
              transition={labelMotionReduced}
            >
              <SpeuHeroCoverImage
                key={`${track.id}:${track.coverUrl}`}
                src={track.coverUrl}
                reduceMotion={!!reduceMotion}
              />
            </motion.div>
          ) : (
            <motion.div
              key="label-solid"
              className="absolute inset-0 bg-primary text-primary-foreground"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
              transition={labelMotionReduced}
            >
              <span
                className="pointer-events-none absolute inset-x-1 top-[10%] text-center font-display text-[0.68rem] font-semibold italic leading-none tracking-[0.16em] text-primary-foreground/95 sm:top-[9%] sm:text-[0.78rem]"
                aria-hidden
              >
                Speǔ
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {showCover && (
          <span
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/25 to-black/20"
            aria-hidden
          />
        )}

        <motion.span
          className="relative z-10 flex size-10 items-center justify-center sm:size-11"
          animate={spinning ? { rotate: -360 } : { rotate: 0 }}
          transition={spinTransition}
        >
          {heroActive && isPlaying ? (
            <>
              <span
                className={cn(
                  "pointer-events-none absolute rounded-full shadow-md ring-1 ring-black/25",
                  "size-2 bg-zinc-900 sm:size-2.5",
                  "opacity-100 transition-opacity duration-200 ease-out",
                  "group-hover:opacity-0 group-focus-visible:opacity-0"
                )}
                aria-hidden
              />
              <Pause
                className={cn(
                  "size-8 text-primary-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] sm:size-9",
                  "opacity-0 transition-opacity duration-200 ease-out",
                  "group-hover:opacity-100 group-focus-visible:opacity-100"
                )}
                fill="currentColor"
                strokeWidth={0}
                aria-hidden
              />
            </>
          ) : (
            <Play
              className="ml-1 size-10 text-primary-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] sm:size-11"
              fill="currentColor"
              strokeWidth={0}
            />
          )}
        </motion.span>
      </motion.button>
    </>
  );

  return (
    <div className="flex flex-col items-center justify-center pt-10 pb-4 sm:pt-14 sm:pb-6">
      <div className="relative flex items-center justify-center size-44 sm:size-52">
        {spinning && (
          <div
            className="pointer-events-none absolute -inset-[10%] rounded-full bg-primary/[0.07] blur-2xl"
            aria-hidden
          />
        )}

        {reduceMotion ? (
          <div className={discClassName}>{discInner}</div>
        ) : (
          <motion.div
            className={discClassName}
            animate={heroActive && isPlaying ? { rotate: 360 } : { rotate: 0 }}
            transition={spinTransition}
          >
            {discInner}
          </motion.div>
        )}
      </div>

      {playableCount === 0 ? (
        <p className="mt-5 max-w-md px-4 text-center text-sm leading-relaxed text-muted-foreground">
          Пакуль няма апублікаваных трэкаў з аўдыё. Дадайце файлы ў адмінцы — і струмень запоўніцца.
        </p>
      ) : null}
    </div>
  );
}
