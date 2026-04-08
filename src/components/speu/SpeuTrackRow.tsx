"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Menu } from "@base-ui/react/menu";
import { MoreHorizontal, Music, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayer, type PlayerTrack } from "@/contexts/PlayerContext";
import type { SpeuChartMovement, SpeuPublicTrack } from "@/lib/speu/types";
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
      className="relative z-[2] shrink-0 md:hidden"
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

function ChartMovementBadge({
  movement,
  delta,
}: {
  movement: SpeuChartMovement;
  delta?: number;
}) {
  if (movement === "same") return null;
  const base =
    "font-mono tabular-nums text-[10px] leading-none max-md:scale-90 max-md:origin-right";
  if (movement === "new") {
    return (
      <span className={cn(base, "text-primary/90")} aria-label="Новы ў чарце">
        Новы
      </span>
    );
  }
  if (movement === "reentry") {
    return (
      <span className={cn(base, "text-primary/85")} aria-label="Зноў у чарце">
        Зноў
      </span>
    );
  }
  if (movement === "up") {
    return (
      <span className={cn(base, "text-emerald-600/90")} aria-label={`Падняўся на ${delta ?? 0} пазіцый`}>
        ↑{delta ?? ""}
      </span>
    );
  }
  return (
    <span className={cn(base, "text-muted-foreground")} aria-label={`Апусціўся на ${delta ?? 0} пазіцый`}>
      ↓{delta ?? ""}
    </span>
  );
}

type SpeuTrackRowProps = {
  track: SpeuPublicTrack;
  index: number;
  /** Нумар у чарце (калі не зададзены — index + 1) */
  rank?: number;
  /** Мітка руху ў snapshot-чарце */
  chartMovement?: SpeuChartMovement;
  chartDelta?: number;
  /** Калі true — паказваць мініяцюру вокладкі */
  showCover?: boolean;
  /** Плэйліст у парадку прайграваньня (чарга ў глабальным плэеры) */
  playlist?: PlayerTrack[];
  className?: string;
};

export function SpeuTrackRow({
  track,
  index,
  rank: rankProp,
  chartMovement,
  chartDelta,
  showCover = true,
  playlist,
  className,
}: SpeuTrackRowProps) {
  const { togglePlay, playPlaylistAt, isTrackActive, isPlaying } = usePlayer();
  const playerTrack: PlayerTrack = speuPublicTrackToPlayerTrack(track);
  const active = isTrackActive(track.id);
  const playing = active && isPlaying;
  const { accentColor, accentRgb } = track;
  const displayRank = rankProp ?? index + 1;

  const playActivate = () => {
    if (playlist && playlist.length > 0) {
      if (active) {
        togglePlay(playerTrack);
      } else {
        playPlaylistAt(playlist, index);
      }
    } else {
      togglePlay(playerTrack);
    }
  };

  const mobilePlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      playActivate();
    }
  };

  const desktopPlayHit = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (typeof window === "undefined" || !window.matchMedia("(min-width: 768px)").matches) {
      return;
    }
    if ("key" in e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
    } else {
      e.stopPropagation();
    }
    playActivate();
  };

  return (
    <div
      className={cn(
        "relative flex items-center gap-0.5 md:gap-1 max-md:pl-0 max-md:pr-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-colors group/track",
        "hover:bg-muted",
        className
      )}
      style={active ? { background: `rgba(${accentRgb}, 0.08)` } : undefined}
    >
      <div className="relative z-[1] flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2 md:gap-2.5">
        <button
          type="button"
          aria-label={playing ? "Паўза" : "Прайграць"}
          onClick={playActivate}
          onKeyDown={mobilePlayKeyDown}
          className={cn(
            "absolute inset-0 z-0 rounded-lg border-0 bg-transparent p-0 outline-none",
            "focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "md:hidden"
          )}
        />

        <div className="relative z-[1] flex min-w-0 flex-1 items-center gap-1.5 max-md:gap-1.5 sm:gap-2 md:gap-2.5 max-md:pointer-events-none md:pointer-events-auto">
          {/* Мабільны: вузкая калонка, нумар прыціснуты да вокладкі; дэсктоп: фіксаваная калонка з клікам */}
          <div
            className={cn(
              "flex h-10 min-h-10 flex-col items-center justify-center gap-0.5",
              "max-md:w-auto max-md:flex-none max-md:shrink-0 max-md:justify-center max-md:pr-0",
              "md:h-10 md:w-12 md:flex-none md:shrink-0"
            )}
          >
            <span className="font-mono tabular-nums text-xs text-muted-foreground/40 md:hidden">
              {displayRank}
            </span>
            {chartMovement ? (
              <span className="md:hidden">
                <ChartMovementBadge movement={chartMovement} delta={chartDelta} />
              </span>
            ) : null}
            <span
              role="button"
              tabIndex={0}
              onClick={desktopPlayHit}
              onKeyDown={desktopPlayHit}
              className={cn(
                "hidden min-h-[1.25rem] w-full cursor-pointer flex-col items-center justify-center gap-0.5 rounded-md outline-none md:flex",
                "focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
            >
              <span className="font-mono tabular-nums text-xs text-muted-foreground/40">{displayRank}</span>
              {chartMovement ? (
                <ChartMovementBadge movement={chartMovement} delta={chartDelta} />
              ) : null}
            </span>
          </div>

          {showCover && (
            <div
              role="presentation"
              onClick={desktopPlayHit}
              className="size-10 shrink-0 cursor-default overflow-hidden rounded-md border border-border/60 bg-muted md:cursor-pointer"
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
                <div className="flex size-full items-center justify-center">
                  <Music className="size-4 opacity-40" style={{ color: accentColor }} strokeWidth={1.5} />
                </div>
              )}
            </div>
          )}

          {playing ? (
            <div
              role="presentation"
              onClick={desktopPlayHit}
              className="relative flex w-4 shrink-0 cursor-default items-center justify-center md:cursor-pointer"
            >
              <Pause
                className="h-3.5 w-3.5"
                style={{ color: accentColor }}
                fill="currentColor"
                strokeWidth={0}
              />
            </div>
          ) : (
            <div
              role="presentation"
              onClick={desktopPlayHit}
              className="relative hidden w-4 shrink-0 cursor-default items-center justify-center md:flex md:cursor-pointer"
            >
              <Music
                className="h-3 w-3 text-muted-foreground/40 transition-opacity group-hover/track:opacity-0"
                strokeWidth={1.5}
              />
              <Play
                className="absolute h-3.5 w-3.5 opacity-0 transition-opacity group-hover/track:opacity-100"
                style={{ color: accentColor }}
                fill="currentColor"
                strokeWidth={0}
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <Link
              href={`/speu/tracks/${track.slug}`}
              className={cn(
                "hidden w-full min-w-0 max-w-full truncate text-sm hover:underline md:block",
                active ? "font-medium" : "text-foreground/80"
              )}
              style={active ? { color: accentColor } : undefined}
            >
              {track.title}
            </Link>
            <span
              className={cn(
                "block w-full min-w-0 max-w-full truncate text-sm md:hidden",
                active ? "font-medium" : "text-foreground/80"
              )}
              style={active ? { color: accentColor } : undefined}
            >
              {track.title}
            </span>
            <div className="mt-0.5 flex flex-wrap items-center text-xs text-muted-foreground">
              {track.artists.map((a, i) => (
                <span key={a.id} className="inline-flex min-w-0 items-center">
                  {i > 0 ? <span className="text-muted-foreground/40">,&nbsp;</span> : null}
                  <Link
                    href={`/speu/artists/${a.slug}`}
                    className="hidden max-w-[10rem] truncate transition-colors hover:text-foreground md:inline lg:max-w-none"
                  >
                    {a.name}
                  </Link>
                  <span className="max-w-[10rem] truncate md:hidden">{a.name}</span>
                </span>
              ))}
            </div>
          </div>

          {!active ? (
            <span
              role="presentation"
              onClick={desktopPlayHit}
              className="w-10 shrink-0 cursor-default text-right font-mono text-[11px] tabular-nums text-muted-foreground/70 md:cursor-pointer"
            >
              {formatTrackDuration(track.durationSec)}
            </span>
          ) : null}

          {playing && <TrackPlayingEqualizer color={accentColor} />}

          {!playing && (
            <span
              role="presentation"
              onClick={desktopPlayHit}
              className="hidden shrink-0 cursor-default sm:block md:cursor-pointer"
            >
              <Play className="h-3 w-3 opacity-0 transition-opacity group-hover/track:opacity-60" style={{ color: accentColor }} strokeWidth={2} />
            </span>
          )}
        </div>
      </div>

      <TrackLikeButton trackId={track.id} accentColor={accentColor} className="relative z-[2] shrink-0" />
      <SpeuTrackRowMobileMenu track={track} />
    </div>
  );
}
