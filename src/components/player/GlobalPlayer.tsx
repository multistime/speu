"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Music, Pause, Play, X } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";

export function GlobalPlayer() {
  const { track, isPlaying, togglePlay, stop } = usePlayer();

  return (
    <AnimatePresence>
      {track && (
        <motion.div
          key="global-player"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur-md"
          style={
            track.accentRgb
              ? { boxShadow: `0 -4px 40px rgba(${track.accentRgb}, 0.08)` }
              : undefined
          }
        >
          {/* Thin accent line on top */}
          {track.accentColor && (
            <div
              className="absolute top-0 inset-x-0 h-px"
              style={{ background: track.accentColor, opacity: 0.5 }}
            />
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
            {/* Icon / cover */}
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
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
                  alt={track.title}
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

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground leading-tight truncate">
                {track.title}
              </p>
              {track.artistName && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {track.artistName}
                </p>
              )}
            </div>

            {/* Equalizer animation when playing */}
            {isPlaying && (
              <div className="hidden sm:flex items-end gap-0.5 h-4 flex-shrink-0">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 rounded-full"
                    style={{ background: track.accentColor ?? "var(--primary)" }}
                    animate={{ height: ["30%", "100%", "50%", "80%", "30%"] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => togglePlay(track)}
                aria-label={isPlaying ? "Пауза" : "Прайграць"}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                style={{
                  background: track.accentColor ?? "var(--primary)",
                  color: "white",
                }}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" fill="currentColor" strokeWidth={0} />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" fill="currentColor" strokeWidth={0} />
                )}
              </button>

              <button
                onClick={stop}
                aria-label="Спыніць"
                className="w-8 h-8 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
