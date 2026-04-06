"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import type { PlayerTrack } from "@/contexts/PlayerContext";
import { cn } from "@/lib/utils";

type SpeuHeroShuffleProps = {
  tracks: PlayerTrack[];
  playableCount: number;
};

export function SpeuHeroShuffle({ tracks, playableCount }: SpeuHeroShuffleProps) {
  const { startNonStopShuffle, nonStopActive, isPlaying, track, togglePlay } = usePlayer();
  const reduceMotion = useReducedMotion();
  const heroActive = nonStopActive && track && tracks.some((t) => t.id === track.id);

  const onMainClick = () => {
    if (playableCount === 0) return;
    if (heroActive && track) {
      togglePlay(track);
      return;
    }
    startNonStopShuffle(tracks);
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-14">
      <div className="relative flex items-center justify-center size-44 sm:size-52">
        {!reduceMotion && (
          <>
            <motion.div
              className="absolute rounded-full border border-primary/15"
              style={{ width: "100%", height: "100%" }}
              animate={heroActive && isPlaying ? { rotate: 360 } : { rotate: 0 }}
              transition={
                heroActive && isPlaying
                  ? { duration: 48, repeat: Infinity, ease: "linear" }
                  : { duration: 0.6 }
              }
            />
            <motion.div
              className="absolute rounded-full border border-primary/10"
              style={{ width: "78%", height: "78%" }}
              animate={heroActive && isPlaying ? { rotate: -360 } : { rotate: 0 }}
              transition={
                heroActive && isPlaying
                  ? { duration: 64, repeat: Infinity, ease: "linear" }
                  : { duration: 0.6 }
              }
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/[0.04]"
              animate={
                heroActive && isPlaying
                  ? { scale: [1, 1.06, 1], opacity: [0.5, 0.85, 0.5] }
                  : { scale: 1, opacity: 0.35 }
              }
              transition={
                heroActive && isPlaying
                  ? { duration: 5.5, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.8 }
              }
            />
          </>
        )}

        <motion.button
          type="button"
          disabled={playableCount === 0}
          onClick={onMainClick}
          whileHover={{ scale: playableCount ? 1.04 : 1 }}
          whileTap={{ scale: playableCount ? 0.97 : 1 }}
          className={cn(
            "relative z-10 size-24 sm:size-28 rounded-full flex items-center justify-center shadow-lg",
            "bg-primary text-primary-foreground border border-primary/20",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary/50"
          )}
          aria-label={
            playableCount === 0
              ? "Няма трэкаў для прайгравання"
              : heroActive && isPlaying
                ? "Паўза"
                : "Слухаць каталог перамешана без перапынку"
          }
        >
          {heroActive && isPlaying ? (
            <Pause className="size-10 sm:size-11" fill="currentColor" strokeWidth={0} />
          ) : (
            <Play className="size-10 sm:size-11 ml-1" fill="currentColor" strokeWidth={0} />
          )}
        </motion.button>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground max-w-md leading-relaxed px-4">
        {playableCount === 0 ? (
          <>Пакуль няма апублікаваных трэкаў з аўдыё. Дадайце файлы ў адмінцы — і струмень запоўніцца.</>
        ) : (
          <>
            <span className="text-foreground font-medium">
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
