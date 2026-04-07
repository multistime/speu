"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Menu } from "@base-ui/react/menu";
import { MoreHorizontal, Music, Pause, Play } from "lucide-react";
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

function SpeuTrackRowMobileMenu({ track }: { track: SpeuPublicTrack }) {
  const router = useRouter();
  const { accentColor } = track;

  const itemClass =
    "flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-foreground outline-none select-none data-highlighted:bg-muted";

  return (
    <div
      className="md:hidden shrink-0"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <Menu.Root modal={false}>
        <Menu.Trigger
          type="button"
          className={cn(
            "rounded-lg border border-transparent p-1.5 transition-colors shrink-0",
            "hover:bg-muted/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40",
            "text-muted-foreground hover:text-foreground"
          )}
          style={accentColor ? { color: accentColor } : undefined}
          aria-label="Дадаткова"
        >
          <MoreHorizontal className="size-4" strokeWidth={2} />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={6} align="end" className="z-50">
            <Menu.Popup className="min-w-[11rem] z-50 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none">
              <Menu.Item
                className={itemClass}
                onClick={() => router.push(`/speu/tracks/${track.slug}`)}
              >
                Старонка трэка
              </Menu.Item>
              {track.album ? (
                <Menu.Item
                  className={itemClass}
                  onClick={() => {
                    const album = track.album;
                    if (album) router.push(`/speu/albums/${album.slug}`);
                  }}
                >
                  Альбом
                </Menu.Item>
              ) : null}
              {track.artists.map((a) => (
                <Menu.Item
                  key={a.id}
                  className={itemClass}
                  onClick={() => router.push(`/speu/artists/${a.slug}`)}
                >
                  {a.name}
                </Menu.Item>
              ))}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}

type SpeuTrackRowProps = {
  track: SpeuPublicTrack;
  index: number;
  /** Калі true — паказваць мініяцюру вокладкі */
  showCover?: boolean;
  /** Плэйліст у парадку прайграваньня (чарга ў глабальным плэеры) */
  playlist?: PlayerTrack[];
  className?: string;
};

export function SpeuTrackRow({
  track,
  index,
  showCover = true,
  playlist,
  className,
}: SpeuTrackRowProps) {
  const { togglePlay, playPlaylistAt, isTrackActive, isPlaying } = usePlayer();
  const playerTrack: PlayerTrack = speuPublicTrackToPlayerTrack(track);
  const active = isTrackActive(track.id);
  const playing = active && isPlaying;
  const { accentColor, accentRgb } = track;

  const playActivate = () => {
    if (playlist && playlist.length > 0) {
      playPlaylistAt(playlist, index);
    } else {
      togglePlay(playerTrack);
    }
  };
  const playKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      playActivate();
    }
  };

  return (
    <div
      className={cn(
        "relative flex items-center gap-0.5 md:gap-1 px-3 py-2 rounded-lg transition-colors group/track",
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
          "flex flex-1 min-w-0 items-center gap-2 sm:gap-2.5 md:gap-3 cursor-pointer rounded-md outline-none",
          "focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
      >
        <span className="shrink-0 min-w-[2.25rem] sm:min-w-[2.5rem] md:min-w-[3rem] pr-1 sm:pr-2 text-right font-mono tabular-nums text-xs text-muted-foreground/40">
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
              "hidden md:block w-full min-w-0 max-w-full truncate text-sm hover:underline",
              active ? "font-medium" : "text-foreground/80"
            )}
            style={active ? { color: accentColor } : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            {track.title}
          </Link>
          <span
            className={cn(
              "md:hidden block w-full min-w-0 max-w-full truncate text-sm",
              active ? "font-medium" : "text-foreground/80"
            )}
            style={active ? { color: accentColor } : undefined}
          >
            {track.title}
          </span>
          <div className="flex flex-wrap items-center text-xs text-muted-foreground mt-0.5">
            {track.artists.map((a, i) => (
              <span key={a.id} className="inline-flex min-w-0 items-center">
                {i > 0 ? <span className="text-muted-foreground/40">,&nbsp;</span> : null}
                <Link
                  href={`/speu/artists/${a.slug}`}
                  className="hidden md:inline truncate max-w-[10rem] lg:max-w-none transition-colors hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  {a.name}
                </Link>
                <span className="md:hidden truncate max-w-[10rem]">{a.name}</span>
              </span>
            ))}
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
      <SpeuTrackRowMobileMenu track={track} />
    </div>
  );
}
