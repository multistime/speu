"use client";

import { motion } from "framer-motion";
import { Music, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { TrackLikeButton } from "@/components/speu/TrackLikeButton";
import { MobileNowPlayingSheet } from "@/components/player/MobileNowPlayingSheet";
import { usePlayer } from "@/contexts/PlayerContext";
import { useSpeuMobileChrome } from "@/contexts/SpeuMobileChromeContext";
import { useUiAccent } from "@/contexts/UiAccentContext";
import { formatPlayerTime } from "@/lib/format-player-time";
import { cn } from "@/lib/utils";
import { GlobalPlayerCoverEqualizer, GlobalPlayerProgress } from "@/components/player/player-dock-progress";

/** Міні-дак унутры `MobileBottomStack` — без партала й без асобнага fixed-слою, каб таб-бар не перакрываўся пры прайграванні */
export function SpeuMiniPlayerDock() {
  const { showBottomNav } = useSpeuMobileChrome();
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
  } = usePlayer();
  const { accentColor, accentRgb } = useUiAccent();
  const rgbCompact = accentRgb.replace(/\s/g, "");

  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const queueNav = nonStopActive && queueSize > 0;
  const canShuffle = queueNav && queueSize > 1;
  const repeatLabel = !queueNav
    ? repeatMode === "off"
      ? "Паўтор выклучаны. Націсніце — паўтор аднаго трэка"
      : "Паўтор аднаго трэка. Націсніце — выключыць паўтор"
    : repeatMode === "off"
      ? "Паўтор выклучаны. Націсніце — паўтор усяго плэйліста"
      : repeatMode === "all"
        ? "Паўтор усяго плэйліста. Націсніце — паўтор аднаго трэка"
        : "Паўтор аднаго трэка. Націсніце — выключыць паўтор";

  useEffect(() => {
    if (!track) queueMicrotask(() => setMobileSheetOpen(false));
  }, [track]);

  if (!showBottomNav) return null;

  const dockShadow = `0 -4px 40px rgba(${rgbCompact}, 0.08)`;

  return (
    <>
      {track ? (
        <motion.div
          key={`speu-stack-dock-${track.id}`}
          initial={{ y: 56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 56, opacity: 0 }}
          transition={{ type: "spring", damping: 32, stiffness: 320 }}
          className={cn(
            "group/player relative isolate z-[1] w-full overflow-hidden",
            "border-t border-border/40 bg-background/95 pt-3 backdrop-blur-md",
          )}
          style={{ boxShadow: dockShadow }}
        >
          <GlobalPlayerProgress />
          <div className="max-w-7xl mx-auto min-h-[3.25rem] px-2 py-2.5 sm:px-6 sm:py-3">
            <div className="flex flex-row items-center gap-1.5 min-w-0">
              <button
                type="button"
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-lg py-0.5 text-left outline-none transition-colors hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Адкрыць плэер"
                onClick={() => setMobileSheetOpen(true)}
              >
                <div
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                  style={{
                    background: `rgba(${rgbCompact}, 0.15)`,
                  }}
                >
                  {track.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={track.coverUrl} alt="" className="size-full object-cover" draggable={false} />
                  ) : (
                    <Music className="w-4 h-4" style={{ color: accentColor }} strokeWidth={1.5} />
                  )}
                  {isPlaying ? <GlobalPlayerCoverEqualizer /> : null}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-tight text-foreground">{track.title}</p>
                  {track.artistName ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground tabular-nums">{track.artistName}</p>
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
                  className="size-10 !min-h-10 !min-w-10 !max-h-10 !max-w-10 shrink-0 rounded-full !p-0 hover:bg-muted/45 active:bg-muted/55"
                />
              ) : null}

              <button
                type="button"
                onClick={() => togglePlay(track)}
                aria-label={isPlaying ? "Паўза" : "Прайграць"}
                className="flex size-10 shrink-0 items-center justify-center rounded-full shadow-sm transition-transform duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: accentColor,
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
          </div>
        </motion.div>
      ) : null}

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
