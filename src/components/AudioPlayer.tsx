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

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  src?: string;
}

const DEMO_TRACKS: Track[] = [
  { id: "1", title: "Балота", artist: "Speǔ", duration: 214 },
  { id: "2", title: "Туман над Нёманам", artist: "Speǔ feat. AI-01", duration: 187 },
  { id: "3", title: "Лясны Сігнал", artist: "Speǔ", duration: 263 },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function WaveformBars({ isPlaying, accent }: { isPlaying: boolean; accent: string }) {
  return (
    <div className="flex items-center gap-[3px] h-8">
      {Array.from({ length: 28 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[2px] rounded-full"
          style={{ backgroundColor: accent }}
          animate={
            isPlaying
              ? {
                  height: [
                    `${8 + Math.sin(i * 0.8) * 8}px`,
                    `${16 + Math.sin(i * 0.5 + 1) * 12}px`,
                    `${8 + Math.sin(i * 0.8) * 8}px`,
                  ],
                  opacity: [0.4, 0.9, 0.4],
                }
              : { height: "4px", opacity: 0.3 }
          }
          transition={
            isPlaying
              ? {
                  duration: 0.8 + (i % 5) * 0.12,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.04,
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

interface AudioPlayerProps {
  isDark?: boolean;
}

export function AudioPlayer({ isDark = true }: AudioPlayerProps) {
  const [trackIdx, setTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const track = DEMO_TRACKS[trackIdx];
  const progress = (currentTime / track.duration) * 100;

  // Theme-resolved colors
  const accent      = isDark ? "#7DBF9E" : "#35654D";
  const accentRgb   = isDark ? "125,191,158" : "53,101,77";
  const fg          = isDark ? "rgba(255,255,255,0.90)" : "rgba(25,29,24,0.90)";
  const fgMuted     = isDark ? "rgba(255,255,255,0.40)" : "rgba(25,29,24,0.45)";
  const fgGhost     = isDark ? "rgba(255,255,255,0.30)" : "rgba(25,29,24,0.30)";
  const progressBg  = isDark ? "rgba(255,255,255,0.10)" : "rgba(25,29,24,0.08)";
  const btnHoverBg  = isDark ? "rgba(255,255,255,0.05)" : "rgba(25,29,24,0.05)";
  const cardBorder  = `rgba(${accentRgb},0.18)`;
  const playBtnBg   = accent;
  const playBtnFg   = isDark ? "#0E1811" : "#FFFFFF";
  const playShadow  = `0 0 20px rgba(${accentRgb},0.4)`;
  const playShadowHover = `0 0 30px rgba(${accentRgb},0.6)`;

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
      className="glass rounded-2xl p-5 w-full max-w-lg"
      style={{ borderColor: cardBorder }}
    >
      {/* Track info */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <AnimatePresence mode="wait">
            <motion.p
              key={track.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="font-mono font-semibold text-sm"
              style={{ color: fg }}
            >
              {track.title}
            </motion.p>
          </AnimatePresence>
          <p className="text-xs mt-0.5" style={{ color: fgMuted }}>
            {track.artist}
          </p>
        </div>
        <WaveformBars isPlaying={isPlaying} accent={accent} />
      </div>

      {/* Progress bar */}
      <div
        className="relative h-1 rounded-full mb-3 cursor-pointer group"
        style={{ backgroundColor: progressBg }}
        onClick={seek}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${progress}%`, backgroundColor: accent }}
          transition={{ duration: 0.1 }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2"
          style={{
            left: `${progress}%`,
            backgroundColor: accent,
            boxShadow: `0 0 8px rgba(${accentRgb},0.8)`,
          }}
        />
      </div>

      {/* Time */}
      <div className="flex justify-between text-[10px] font-mono mb-4" style={{ color: fgGhost }}>
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(track.duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMuted((m) => !m)}
          className="p-2 rounded-lg transition-colors"
          style={{ color: fgMuted }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = fg; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = fgMuted; }}
        >
          {muted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={skipPrev}
            className="p-2 rounded-lg transition-colors"
            style={{ color: fgMuted }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = fg;
              el.style.backgroundColor = btnHoverBg;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = fgMuted;
              el.style.backgroundColor = "transparent";
            }}
          >
            <SkipBack className="h-4 w-4" strokeWidth={1.5} />
          </button>

          <motion.button
            onClick={togglePlay}
            whileTap={{ scale: 0.92 }}
            className={cn(
              "relative flex items-center justify-center h-11 w-11 rounded-full font-medium transition-all duration-300 hover:scale-105"
            )}
            style={{
              backgroundColor: playBtnBg,
              color: playBtnFg,
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
            onClick={skipNext}
            className="p-2 rounded-lg transition-colors"
            style={{ color: fgMuted }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = fg;
              el.style.backgroundColor = btnHoverBg;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = fgMuted;
              el.style.backgroundColor = "transparent";
            }}
          >
            <SkipForward className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <span className="text-[10px] font-mono" style={{ color: fgGhost }}>
          {trackIdx + 1}/{DEMO_TRACKS.length}
        </span>
      </div>
    </motion.div>
  );
}
