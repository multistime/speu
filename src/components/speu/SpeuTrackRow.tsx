"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Music, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayer, type PlayerTrack } from "@/contexts/PlayerContext";
import type { SpeuPublicTrack } from "@/lib/speu/types";
import { speuPublicTrackToPlayerTrack } from "@/lib/speu/player-map";
import { formatTrackDuration } from "@/components/speu/speu-format-duration";
import { TrackLikeButton } from "@/components/speu/TrackLikeButton";

function TrackPlayingEqualizer({ color }: { color: string }) {
  const bars = 4;
  return (
    <div
      className="flex items-end justify-end gap-0.5 h-3.5 w-[18px] shrink-0 ml-auto"
      aria-hidden
    >
      {Array.from({ length: bars }, (_, i) => (
        <motion.div
          key={i}
          className="w-[2px] h-3.5 rounded-full origin-bottom"
          style={{ backgroundColor: color }}
          animate={{
            scaleY: [0.35, 1, 0.5, 0.85, 0.35],
          }}
          transition={{
            duration: 0.55 + i * 0.12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.07,
          }}
        />
      ))}
    </div>
  );
}

type SpeuTrackRowProps = {
  track: SpeuPublicTrack;
  index: number;
  /** Калі true — паказваць мініяцюру вокладкі */
  showCover?: boolean;
  className?: string;
};

export function SpeuTrackRow({ track, index, showCover = true, className }: SpeuTrackRowProps) {
  const { togglePlay, isTrackActive, isPlaying } = usePlayer();
  const playerTrack: PlayerTrack = speuPublicTrackToPlayerTrack(track);
  const active = isTrackActive(track.id);
  const playing = active && isPlaying;
  const { accentColor, accentRgb } = track;

  const playActivate = () => togglePlay(playerTrack);
  const playKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      togglePlay(playerTrack);
    }
  };

  return (
    <div
      className={cn(
        "relative flex items-center gap-1 px-3 py-2 rounded-lg transition-colors group/track",
        "hover:bg-muted",
        className
      )}
      style={active ? { background: `rgba(${accentRgb}, 0.08)` } : undefined}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={playActivate}
        onKeyDown={playKeyDown}
        className={cn(
          "flex flex-1 min-w-0 items-center gap-3 cursor-pointer rounded-md outline-none",
          "focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
      >
        <span className="text-xs text-muted-foreground/40 w-6 font-mono shrink-0 tabular-nums">
          {index + 1}
        </span>

        {showCover && (
          <div
            className="size-10 rounded-md overflow-hidden shrink-0 border border-border/60 bg-muted"
            style={
              !track.coverUrl
                ? {
                    background: `linear-gradient(160deg, ${track.accentColor}33 0%, transparent 100%)`,
                  }
                : undefined
            }
          >
            {track.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={track.coverUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="size-full flex items-center justify-center">
                <Music className="size-4 opacity-40" style={{ color: accentColor }} strokeWidth={1.5} />
              </div>
            )}
          </div>
        )}

        <div className="shrink-0 w-4 flex items-center justify-center relative">
          {playing ? (
            <Pause
              className="h-3.5 w-3.5"
              style={{ color: accentColor }}
              fill="currentColor"
              strokeWidth={0}
            />
          ) : (
            <>
              <Music
                className="h-3 w-3 text-muted-foreground/40 group-hover/track:opacity-0 transition-opacity"
                strokeWidth={1.5}
              />
              <Play
                className="h-3.5 w-3.5 absolute opacity-0 group-hover/track:opacity-100 transition-opacity"
                style={{ color: accentColor }}
                fill="currentColor"
                strokeWidth={0}
              />
            </>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <Link
            href={`/speu/tracks/${track.slug}`}
            className={cn(
              "text-sm block truncate hover:underline",
              active ? "font-medium" : "text-foreground/80"
            )}
            style={active ? { color: accentColor } : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            {track.title}
          </Link>
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
            {track.artists.map((a, i) => (
              <span key={a.id} className="inline-flex items-center gap-1.5">
                {i > 0 && <span className="text-muted-foreground/40">·</span>}
                <Link
                  href={`/speu/artists/${a.slug}`}
                  className="hover:text-foreground transition-colors truncate max-w-[10rem] sm:max-w-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  {a.name}
                </Link>
              </span>
            ))}
            {track.album && (
              <>
                <span className="text-muted-foreground/35">—</span>
                <Link
                  href={`/speu/albums/${track.album.slug}`}
                  className="hover:text-foreground transition-colors truncate max-w-[12rem]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {track.album.title}
                </Link>
              </>
            )}
          </div>
        </div>

        <span className="text-[11px] font-mono text-muted-foreground/70 shrink-0 tabular-nums w-10 text-right">
          {formatTrackDuration(track.durationSec)}
        </span>

        {playing && <TrackPlayingEqualizer color={accentColor} />}

        {!playing && (
          <Play
            className="h-3 w-3 opacity-0 group-hover/track:opacity-60 transition-opacity shrink-0 sm:block hidden"
            style={{ color: accentColor }}
            strokeWidth={2}
          />
        )}
      </div>

      <TrackLikeButton trackId={track.id} accentColor={accentColor} />
    </div>
  );
}
