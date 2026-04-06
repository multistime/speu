"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import type { PlayerTrack } from "@/contexts/PlayerContext";
import { cn } from "@/lib/utils";

const SPIN_DURATION_SEC = 44;

const GROOVE_RINGS: { sizePct: number; borderClass: string }[] = [
  { sizePct: 100, borderClass: "border-primary/22" },
  { sizePct: 92, borderClass: "border-primary/17" },
  { sizePct: 84, borderClass: "border-primary/14" },
  { sizePct: 76, borderClass: "border-primary/11" },
  { sizePct: 68, borderClass: "border-primary/9" },
  { sizePct: 60, borderClass: "border-primary/7" },
];

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
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {GROOVE_RINGS.map(({ sizePct, borderClass }, i) => (
          <div
            key={i}
            className={cn("absolute rounded-full border", borderClass)}
            style={{
              width: `${sizePct}%`,
              height: `${sizePct}%`,
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </div>

      <motion.button
        type="button"
        disabled={playableCount === 0}
        onClick={onMainClick}
        whileHover={{ scale: playableCount ? 1.04 : 1 }}
        whileTap={{ scale: playableCount ? 0.97 : 1 }}
        className={cn(
          "relative z-10 flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-lg sm:size-28",
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={track.coverUrl} alt="" className="size-full object-cover" />
            </motion.div>
          ) : (
            <motion.div
              key="label-solid"
              className="absolute inset-0 bg-primary"
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
          className="relative z-10 flex items-center justify-center text-primary-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
          animate={spinning ? { rotate: -360 } : { rotate: 0 }}
          transition={spinTransition}
        >
          {heroActive && isPlaying ? (
            <Pause className="size-10 sm:size-11" fill="currentColor" strokeWidth={0} />
          ) : (
            <Play className="ml-1 size-10 sm:size-11" fill="currentColor" strokeWidth={0} />
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
