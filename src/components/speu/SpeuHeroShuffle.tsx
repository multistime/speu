"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import type { PlayerTrack } from "@/contexts/PlayerContext";
import { cn } from "@/lib/utils";

const SPIN_DURATION_SEC = 44;

const GROOVE_VIEW = { cx: 50, cy: 50, maxR: 49.15 };

/** Лёгкая неровнасьць кола — як прэсавая пласцінка, а не ідэальны вектар */
function wavyGroovePath(
  sizePct: number,
  waveCount: number,
  amplitude: number,
  phase: number,
  segments = 100
): string {
  const baseR = (sizePct / 100) * GROOVE_VIEW.maxR;
  const { cx, cy } = GROOVE_VIEW;
  const pts: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const wobble = amplitude * Math.sin(waveCount * t + phase);
    const r = baseR + wobble;
    pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
  }
  let d = `M ${pts[0][0].toFixed(3)} ${pts[0][1].toFixed(3)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i][0].toFixed(3)} ${pts[i][1].toFixed(3)}`;
  }
  return `${d} Z`;
}

const GROOVE_SPECS = [
  { sizePct: 100, waveCount: 6, amplitude: 0.42, phase: 0.2, opacity: 0.22 },
  { sizePct: 92, waveCount: 7, amplitude: 0.36, phase: 1.4, opacity: 0.17 },
  { sizePct: 84, waveCount: 5, amplitude: 0.4, phase: 2.7, opacity: 0.14 },
  { sizePct: 76, waveCount: 8, amplitude: 0.3, phase: 0.9, opacity: 0.11 },
  { sizePct: 68, waveCount: 6, amplitude: 0.34, phase: 3.1, opacity: 0.09 },
  { sizePct: 60, waveCount: 7, amplitude: 0.28, phase: 2.2, opacity: 0.07 },
] as const;

const WAVY_GROOVES = GROOVE_SPECS.map(({ sizePct, waveCount, amplitude, phase, opacity }) => ({
  d: wavyGroovePath(sizePct, waveCount, amplitude, phase),
  opacity,
}));

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
      <svg
        className="pointer-events-none absolute inset-0 size-full text-primary"
        viewBox="0 0 100 100"
        aria-hidden
      >
        {WAVY_GROOVES.map(({ d, opacity }, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.38}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ opacity }}
          />
        ))}
      </svg>

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
          !showCover && !(heroActive && isPlaying) && "bg-primary text-primary-foreground"
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={track.coverUrl} alt="" className="size-full object-cover" />
            </motion.div>
          ) : (
            <motion.div
              key="label-solid"
              className={cn(
                "absolute inset-0",
                !(heroActive && isPlaying) && "bg-primary"
              )}
              style={
                heroActive && isPlaying
                  ? {
                      background:
                        "conic-gradient(from 28deg, var(--primary), color-mix(in srgb, var(--primary) 68%, white) 18%, var(--primary) 38%, color-mix(in srgb, var(--primary) 72%, var(--primary-foreground)) 62%, var(--primary) 82%, color-mix(in srgb, var(--primary) 65%, white))",
                    }
                  : undefined
              }
              initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
              transition={labelMotionReduced}
            />
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
    <div className="flex flex-col items-center justify-center py-10 sm:py-14">
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

      <p className="mt-6 max-w-md px-4 text-center text-sm leading-relaxed text-muted-foreground">
        {playableCount === 0 ? (
          <>Пакуль няма апублікаваных трэкаў з аўдыё. Дадайце файлы ў адмінцы — і струмень запоўніцца.</>
        ) : (
          <>
            <span className="font-medium text-foreground">
              {playableCount} {playableCount === 1 ? "трэк" : playableCount < 5 ? "трэкі" : "трэкаў"}
            </span>
            {" · "}
            выпадковы парадак, бесперапынна. Гэта не радыё-старонка — толькі ваш каталог у браўзеры.
          </>
        )}
      </p>
    </div>
  );
}
