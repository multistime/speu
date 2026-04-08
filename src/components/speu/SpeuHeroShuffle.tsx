"use client";

import { useId, useState, type CSSProperties, type SyntheticEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import type { PlayerTrack } from "@/contexts/PlayerContext";
import { cn } from "@/lib/utils";

const SPIN_DURATION_SEC = 44;

const GROOVE_MAX_R = 49.15;

/**
 * Ідэальныя акружнасьці (як раней у div-border), з 2–3 кароткімі разрывамі на кожную —
 * як гадавыя кольцы дрэва, з лёгкім «пульсам» пры кручэньні.
 */
function treeRingGapDash(r: number, ringIndex: number): { dasharray: string; dashoffset: number } {
  const C = 2 * Math.PI * r;
  const gapCount = 2 + (ringIndex % 2);
  const gapLen = C * (0.009 + (ringIndex % 5) * 0.00085);
  const totalGap = gapLen * gapCount;
  const dashLen = (C - totalGap) / gapCount;
  const dasharray = Array.from({ length: gapCount }, () => `${dashLen.toFixed(2)} ${gapLen.toFixed(2)}`).join(
    " "
  );
  const dashoffset = ((ringIndex * 29 + 13) % 71) * (C / 95);
  return { dasharray, dashoffset };
}

const GROOVE_LAYERS = [
  { sizePct: 100, opacity: 0.44, strokeWidth: 1.02 },
  { sizePct: 92, opacity: 0.34, strokeWidth: 0.56 },
  { sizePct: 84, opacity: 0.28, strokeWidth: 0.5 },
  { sizePct: 76, opacity: 0.23, strokeWidth: 0.47 },
  { sizePct: 68, opacity: 0.19, strokeWidth: 0.44 },
  { sizePct: 60, opacity: 0.15, strokeWidth: 0.41 },
] as const;

const TREE_RING_CIRCLES = GROOVE_LAYERS.map((layer, i) => {
  const r = (layer.sizePct / 100) * GROOVE_MAX_R;
  const { dasharray, dashoffset } = treeRingGapDash(r, i);
  return { ...layer, r, dasharray, dashoffset };
});

/** key на бацьку скідвае стан; зелёная падложка + decode() перад fade — без шэрай успышкі браўзера */
function SpeuHeroCoverImage({ src, reduceMotion }: { src: string; reduceMotion: boolean }) {
  const [ready, setReady] = useState(false);

  const finish = () => setReady(true);

  const onImgLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget;
    if (typeof el.decode === "function") {
      void el.decode().then(finish).catch(finish);
    } else {
      finish();
    }
  };

  return (
    <div className="absolute inset-0 bg-primary">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="eager"
        fetchPriority="high"
        onLoad={onImgLoad}
        onError={finish}
        className={cn(
          "absolute inset-0 size-full bg-primary object-cover",
          !reduceMotion && "transition-opacity duration-300 ease-out",
          ready ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}

/** 1 = мінімальны памер (як раней), 5 — найбуйнейшы; крокі крыху буйнейшыя за бачнасць на экране */
export function speuHubDiscScaleFactor(level: number): number {
  const L = Math.min(5, Math.max(1, Math.round(level)));
  return 1 + (L - 1) * 0.168;
}

type SpeuHeroShuffleProps = {
  tracks: PlayerTrack[];
  playableCount: number;
  /** 1–5 з site_settings; па змаўчанні 1 */
  scaleLevel?: number;
};

export function SpeuHeroShuffle({ tracks, playableCount, scaleLevel = 1 }: SpeuHeroShuffleProps) {
  const labelArcId = useId().replace(/:/g, "");
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

  const df = speuHubDiscScaleFactor(scaleLevel);
  const outerMob = 11 * df;
  const outerSm = 13 * df;
  const discVars = {
    "--speu-disc-f": String(df),
    "--speu-o": `${outerMob}rem`,
    "--speu-o-sm": `${outerSm}rem`,
  } as CSSProperties;

  const discClassName = "relative flex size-full items-center justify-center";

  const discInner = (
    <>
      <div className="pointer-events-none absolute inset-0 rounded-full">
        <svg
          className="absolute inset-0 size-full text-primary"
          viewBox="0 0 100 100"
          aria-hidden
        >
          {TREE_RING_CIRCLES.map(({ r, dasharray, dashoffset, opacity, strokeWidth }, i) => (
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
          "group relative z-10 flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground shadow-lg",
          "h-[calc(6rem*var(--speu-disc-f))] w-[calc(6rem*var(--speu-disc-f))] sm:h-[calc(7rem*var(--speu-disc-f))] sm:w-[calc(7rem*var(--speu-disc-f))]",
          "border border-primary/25 disabled:cursor-not-allowed disabled:opacity-40",
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
        <AnimatePresence mode="wait">
          {showCover && track?.coverUrl ? (
            <motion.div
              key={track.id}
              className="absolute inset-0 bg-primary"
              initial={reduceMotion ? false : { opacity: 1, scale: 0.94 }}
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
              <svg
                className="pointer-events-none absolute inset-0 size-full"
                viewBox="0 0 100 100"
                aria-hidden
              >
                <defs>
                  <path
                    id={labelArcId}
                    d="M 20 51 A 30 30 0 0 0 80 51"
                    fill="none"
                  />
                </defs>
                <text
                  className="font-display font-semibold italic"
                  fill="currentColor"
                  fillOpacity={0.95}
                  fontSize={11}
                  letterSpacing="0.16em"
                >
                  <textPath href={`#${labelArcId}`} startOffset="50%" textAnchor="middle">
                    Speǔ
                  </textPath>
                </text>
              </svg>
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
          className="relative z-10 flex items-center justify-center h-[calc(2.5rem*var(--speu-disc-f))] w-[calc(2.5rem*var(--speu-disc-f))] sm:h-[calc(2.75rem*var(--speu-disc-f))] sm:w-[calc(2.75rem*var(--speu-disc-f))]"
          animate={spinning ? { rotate: -360 } : { rotate: 0 }}
          transition={spinTransition}
        >
          {heroActive && isPlaying ? (
            <>
              <span
                className={cn(
                  "pointer-events-none absolute rounded-full shadow-md ring-1 ring-black/25",
                  "h-[calc(0.5rem*var(--speu-disc-f))] w-[calc(0.5rem*var(--speu-disc-f))] bg-zinc-900 sm:h-[calc(0.625rem*var(--speu-disc-f))] sm:w-[calc(0.625rem*var(--speu-disc-f))]",
                  "opacity-100 transition-opacity duration-200 ease-out",
                  "group-hover:opacity-0 group-focus-visible:opacity-0"
                )}
                aria-hidden
              />
              <Pause
                className={cn(
                  "text-primary-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]",
                  "h-[calc(2rem*var(--speu-disc-f))] w-[calc(2rem*var(--speu-disc-f))] sm:h-[calc(2.25rem*var(--speu-disc-f))] sm:w-[calc(2.25rem*var(--speu-disc-f))]",
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
              className="ml-[calc(0.125rem*var(--speu-disc-f))] text-primary-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] h-[calc(2.5rem*var(--speu-disc-f))] w-[calc(2.5rem*var(--speu-disc-f))] sm:h-[calc(2.75rem*var(--speu-disc-f))] sm:w-[calc(2.75rem*var(--speu-disc-f))]"
              fill="currentColor"
              strokeWidth={0}
            />
          )}
        </motion.span>
      </motion.button>
    </>
  );

  return (
    <div className="flex flex-col items-center justify-center pb-1 sm:pb-2">
      <div
        style={discVars}
        className="relative mx-auto flex aspect-square w-[min(92vw,var(--speu-o))] max-w-[min(92vw,var(--speu-o))] h-[min(92vw,var(--speu-o))] max-h-[min(92vw,var(--speu-o))] items-center justify-center sm:w-[min(92vw,var(--speu-o-sm))] sm:max-w-[min(92vw,var(--speu-o-sm))] sm:h-[min(92vw,var(--speu-o-sm))] sm:max-h-[min(92vw,var(--speu-o-sm))]"
      >
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
