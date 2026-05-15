"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Music,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { MobileNowPlayingSheet } from "@/components/player/MobileNowPlayingSheet";
import { GlobalPlayerCoverEqualizer, GlobalPlayerProgress } from "@/components/player/player-dock-progress";
import { TrackLikeButton } from "@/components/speu/TrackLikeButton";
import { usePlayer } from "@/contexts/PlayerContext";
import { useSpeuMobileChrome } from "@/contexts/SpeuMobileChromeContext";
import { useUiAccent } from "@/contexts/UiAccentContext";
import { formatPlayerTime } from "@/lib/format-player-time";
import { cn } from "@/lib/utils";

const ctrlBtn =
  "w-9 h-9 rounded-full border flex items-center justify-center transition-colors shrink-0 disabled:opacity-35 disabled:pointer-events-none";

export function GlobalPlayer() {
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
    cycleRepeatMode,
    toggleShuffle,
    skipNext,
    skipPrevious,
    stop,
  } = usePlayer();
  const { accentColor, accentRgb } = useUiAccent();
  const { showBottomNav, mobileViewport } = useSpeuMobileChrome();

  const rgbCompact = accentRgb.replace(/\s/g, "");
  const dockShadow = `0 -4px 40px rgba(${rgbCompact}, 0.08)`;
  const queueNav = nonStopActive && queueSize > 0;
  const canShuffle = queueNav && queueSize > 1;
  const canSkipNext = queueNav;

  const repeatLabel = !queueNav
    ? repeatMode === "off"
      ? "Паўтор выклучаны. Націсніце — паўтор аднаго трэка"
      : "Паўтор аднаго трэка. Націсніце — выключыць паўтор"
    : repeatMode === "off"
      ? "Паўтор выклучаны. Націсніце — паўтор усяго плэйліста"
      : repeatMode === "all"
        ? "Паўтор усяго плэйліста. Націсніце — паўтор аднаго трэка"
        : "Паўтор аднаго трэка. Націсніце — выключыць паўтор";

  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  useEffect(() => {
    if (!track) queueMicrotask(() => setMobileSheetOpen(false));
  }, [track]);

  const mobileFallbackDock =
    track == null ? null : (
      <>
        <GlobalPlayerProgress />
        <div className="max-w-7xl mx-auto min-h-[3.25rem] px-2 py-2.5 sm:px-6 sm:py-3">
          <div className="flex min-w-0 flex-row items-center gap-1.5">
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
                className="shrink-0 whitespace-nowrap font-mono text-[10px] tracking-tight text-muted-foreground/90 tabular-nums"
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
      </>
    );

  return (
    <>
      {/* Mobile fallback (admin) without bottom nav */}
      <AnimatePresence>
        {track && mobileViewport && !showBottomNav ? (
          <motion.div
            key="global-player-mobile-fixed"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="group/player fixed inset-x-0 bottom-0 z-[60] overflow-hidden border-t border-border/40 bg-background/95 pt-3 backdrop-blur-md md:hidden"
            style={{ boxShadow: dockShadow }}
          >
            {mobileFallbackDock}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Desktop / non-mobile-chrome player bar */}
      <AnimatePresence>
        {track && !showBottomNav && !mobileViewport ? (
          <motion.div
            key="global-player-desktop"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className={cn(
              "group/player fixed inset-x-0 bottom-0 z-50 hidden overflow-hidden border-t border-border/40 bg-background/95 pt-3 backdrop-blur-md md:flex md:flex-col",
            )}
            style={{ boxShadow: dockShadow }}
          >
            <GlobalPlayerProgress />

            <div className="max-w-7xl mx-auto min-h-[3.25rem] w-full px-2 py-2.5 sm:px-6 sm:py-3">
              <div className="flex min-h-[3.25rem] w-full flex-row items-center gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg sm:h-9 sm:w-9"
                    style={{
                      background: `rgba(${rgbCompact}, 0.15)`,
                      border: `1px solid rgba(${rgbCompact}, 0.25)`,
                    }}
                  >
                    {track.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={track.coverUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Music className="w-4 h-4" style={{ color: accentColor }} strokeWidth={1.5} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-tight text-foreground">
                      {track.trackHref ? (
                        <Link
                          href={track.trackHref}
                          className="underline-offset-2 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {track.title}
                        </Link>
                      ) : (
                        track.title
                      )}
                    </p>
                    <div className="mt-0.5 flex min-w-0 items-center gap-2 text-xs tabular-nums text-muted-foreground">
                      {track.artistName ? (
                        track.artistSlug ? (
                          <Link
                            href={`/speu/artists/${track.artistSlug}`}
                            className="min-w-0 truncate transition-colors hover:text-foreground"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {track.artistName}
                          </Link>
                        ) : (
                          <span className="min-w-0 truncate">{track.artistName}</span>
                        )
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-center gap-0.5 px-0.5 sm:gap-1 sm:px-1">
                  <button
                    type="button"
                    onClick={toggleShuffle}
                    disabled={!canShuffle}
                    aria-label={shuffleEnabled ? "Выпадковы парадак уключаны" : "Уключыць выпадковы парадак"}
                    aria-pressed={shuffleEnabled}
                    className={cn(
                      ctrlBtn,
                      shuffleEnabled
                        ? "border-primary/50 bg-primary/12 text-primary"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                    )}
                  >
                    <Shuffle className="h-4 w-4" strokeWidth={2} />
                  </button>

                  <button
                    type="button"
                    onClick={skipPrevious}
                    aria-label="Папярэдні трэк"
                    className={cn(
                      ctrlBtn,
                      "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                    )}
                  >
                    <SkipBack className="h-4 w-4" strokeWidth={2} />
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePlay(track)}
                    aria-label={isPlaying ? "Паўза" : "Прайграць"}
                    className="mx-0.5 flex h-11 w-11 items-center justify-center rounded-full shadow-sm transition-all duration-200 hover:scale-105"
                    style={{
                      background: accentColor,
                      color: "white",
                    }}
                  >
                    {isPlaying ? (
                      <Pause className="h-[18px] w-[18px]" fill="currentColor" strokeWidth={0} />
                    ) : (
                      <Play className="ml-0.5 h-[18px] w-[18px]" fill="currentColor" strokeWidth={0} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={skipNext}
                    disabled={!canSkipNext}
                    aria-label="Наступны трэк"
                    className={cn(
                      ctrlBtn,
                      "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                    )}
                  >
                    <SkipForward className="h-4 w-4" strokeWidth={2} />
                  </button>

                  <button
                    type="button"
                    onClick={cycleRepeatMode}
                    aria-label={repeatLabel}
                    aria-pressed={repeatMode !== "off"}
                    className={cn(
                      ctrlBtn,
                      repeatMode !== "off"
                        ? "border-primary/50 bg-primary/12 text-primary"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                    )}
                  >
                    {repeatMode === "one" ? (
                      <Repeat1 className="h-4 w-4" strokeWidth={2} />
                    ) : (
                      <Repeat className="h-4 w-4" strokeWidth={2} />
                    )}
                  </button>

                  <span className="inline-flex size-10 shrink-0 items-center justify-center">
                    {track.trackHref?.startsWith("/speu/tracks/") ? (
                      <TrackLikeButton
                        trackId={track.id}
                        size="lg"
                        className="size-10 !min-h-10 !min-w-10 !max-h-10 !max-w-10 rounded-full !p-0 hover:bg-muted/45 active:bg-muted/55"
                      />
                    ) : null}
                  </span>
                </div>

                <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
                  <span
                    className="min-w-[7.25rem] shrink-0 whitespace-nowrap text-right font-mono text-[10px] tracking-tight text-muted-foreground/90 tabular-nums sm:min-w-[7.75rem] sm:text-[11px]"
                    aria-live="polite"
                  >
                    {formatPlayerTime(currentTime)} / {duration > 0 ? formatPlayerTime(duration) : "—:—"}
                  </span>

                  {isPlaying ? (
                    <span className="inline-flex h-[22px] shrink-0 items-end gap-[3px]" aria-hidden>
                      {[1, 2, 3].map((i) => (
                        <motion.span
                          key={i}
                          className="w-[3px] min-w-[3px] rounded-full"
                          style={{ background: accentColor }}
                          animate={{ height: ["35%", "100%", "45%", "85%", "35%"] }}
                          transition={{
                            duration: 0.75,
                            repeat: Infinity,
                            delay: i * 0.12,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </span>
                  ) : null}

                  <button
                    type="button"
                    onClick={stop}
                    aria-label="Спыніць"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {track && mobileViewport && !showBottomNav ? (
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
