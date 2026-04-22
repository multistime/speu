"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiAccent } from "@/contexts/UiAccentContext";

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  src?: string;
}

const DEMO_TRACKS: Track[] = [
  { id: "1", title: "Балота", artist: "Спеў", duration: 214 },
  { id: "2", title: "Туман над Нёманам", artist: "Спеў feat. AI-01", duration: 187 },
  { id: "3", title: "Лясны Сігнал", artist: "Спеў", duration: 263 },
];

const WAVE_BAR_COUNT = 16;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function WaveformBars({ isPlaying, accent }: { isPlaying: boolean; accent: string }) {
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden>
      {Array.from({ length: WAVE_BAR_COUNT }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-[2px] rounded-full",
            isPlaying ? "speu-hero-waveform-bar h-6" : "h-1 opacity-40",
          )}
          style={{
            backgroundColor: accent,
            animationDelay: isPlaying ? `${i * 0.04}s` : undefined,
          }}
        />
      ))}
    </div>
  );
}

export function AudioPlayer() {
  const [trackIdx, setTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { accentColor: accent, glowPrimaryRgb } = useUiAccent();
  const accentRgbSpaced = glowPrimaryRgb;

  const track = DEMO_TRACKS[trackIdx];
  const progress = (currentTime / track.duration) * 100;

  const cardBorder = `rgba(${accentRgbSpaced},0.18)`;
  const playShadow = `0 0 20px rgba(${accentRgbSpaced},0.4)`;
  const playShadowHover = `0 0 30px rgba(${accentRgbSpaced},0.6)`;

  const clearTick = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const play = useCallback(() => {
    setIsPlaying(true);
    intervalRef.current = setInterval(() => {
      setCurrentTime((t) => {
        if (t >= track.duration - 1) {
          clearInterval(intervalRef.current!);
          setIsPlaying(false);
          return 0;
        }
        return t + 1;
      });
    }, 1000);
  }, [track.duration]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    clearTick();
  }, []);

  const togglePlay = () => (isPlaying ? pause() : play());

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const newTime = ratio * track.duration;
    setCurrentTime(newTime);
  };

  const skipNext = () => {
    clearTick();
    setIsPlaying(false);
    setCurrentTime(0);
    setTrackIdx((i) => (i + 1) % DEMO_TRACKS.length);
  };

  const skipPrev = () => {
    clearTick();
    setIsPlaying(false);
    setCurrentTime(0);
    setTrackIdx((i) => (i - 1 + DEMO_TRACKS.length) % DEMO_TRACKS.length);
  };

  useEffect(() => {
    return () => clearTick();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "glass w-full max-w-lg rounded-2xl border p-5",
        "max-md:bg-card/95 max-md:[backdrop-filter:none] max-md:[-webkit-backdrop-filter:none]",
      )}
      style={{ borderColor: cardBorder }}
    >
      {/* Track info */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <AnimatePresence mode="wait">
            <motion.p
              key={track.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="font-mono text-sm font-semibold text-foreground"
            >
              {track.title}
            </motion.p>
          </AnimatePresence>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {track.artist}
          </p>
        </div>
        <WaveformBars isPlaying={isPlaying} accent={accent} />
      </div>

      {/* Progress bar */}
      <div
        className="group relative mb-3 h-1 cursor-pointer rounded-full bg-muted"
        onClick={seek}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${progress}%`, backgroundColor: accent }}
          transition={{ duration: 0.1 }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
          style={{
            left: `${progress}%`,
            backgroundColor: accent,
            boxShadow: `0 0 8px rgba(${accentRgbSpaced},0.8)`,
          }}
        />
      </div>

      {/* Time */}
      <div className="mb-4 flex justify-between text-[10px] font-mono text-muted-foreground/80">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(track.duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          {muted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={skipPrev}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <SkipBack className="h-4 w-4" strokeWidth={1.5} />
          </button>

          <motion.button
            type="button"
            onClick={togglePlay}
            whileTap={{ scale: 0.92 }}
            className={cn(
              "relative flex h-11 w-11 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground transition-all duration-300 hover:scale-105",
            )}
            style={{
              boxShadow: playShadow,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = playShadowHover;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = playShadow;
            }}
          >
            <AnimatePresence mode="wait">
              {isPlaying ? (
                <motion.span
                  key="pause"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Pause className="h-5 w-5" strokeWidth={2} />
                </motion.span>
              ) : (
                <motion.span
                  key="play"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Play className="h-5 w-5 translate-x-0.5" strokeWidth={2} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <button
            type="button"
            onClick={skipNext}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <SkipForward className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <span className="text-[10px] font-mono text-muted-foreground/70">
          {trackIdx + 1}/{DEMO_TRACKS.length}
        </span>
      </div>
    </motion.div>
  );
}
