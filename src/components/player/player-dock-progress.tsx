"use client";

import { motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { useUiAccent } from "@/contexts/UiAccentContext";
import { formatPlayerTime } from "@/lib/format-player-time";
import { clientXToSeekRatio } from "@/lib/player-progress";
import { cn } from "@/lib/utils";

export function GlobalPlayerProgress({
  className,
  layout = "dock",
}: {
  /** Напрыклад, для шторкі: mx-auto mt-3 w-full max-w-md */
  className?: string;
  /** dock — тонкая рэйка ўнізе бару; sheet — высокая зона дотыку, скраб па свайпе */
  layout?: "dock" | "sheet";
}) {
  const { currentTime, duration, canSeek, seekRatio, isPlaying } = usePlayer();
  const { accentColor } = useUiAccent();

  const railRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragRatio, setDragRatio] = useState<number | null>(null);
  const isSheet = layout === "sheet";

  const livePct =
    canSeek && duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const progress = dragRatio !== null ? dragRatio : livePct;
  const pct = Math.min(100, Math.max(0, progress * 100));

  const applyRatio = useCallback(
    (ratio: number) => {
      const r = Math.min(1, Math.max(0, ratio));
      setDragRatio(r);
      seekRatio(r);
    },
    [seekRatio]
  );

  const applyFromClientX = useCallback(
    (clientX: number) => {
      const el = railRef.current;
      if (!el || !canSeek) return;
      applyRatio(clientXToSeekRatio(el.getBoundingClientRect(), clientX));
    },
    [canSeek, applyRatio]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canSeek) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    setIsDragging(true);
    applyFromClientX(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !canSeek) return;
    applyFromClientX(e.clientX);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    draggingRef.current = false;
    setIsDragging(false);
    setDragRatio(null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!canSeek || duration <= 0) return;
    const step = e.shiftKey ? 30 : 5;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      seekRatio(Math.min(1, Math.max(0, (currentTime - step) / duration)));
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      seekRatio(Math.min(1, Math.max(0, (currentTime + step) / duration)));
    } else if (e.key === "Home") {
      e.preventDefault();
      seekRatio(0);
    } else if (e.key === "End") {
      e.preventDefault();
      seekRatio(1);
    }
  };

  const fillStyle = { background: accentColor };

  const fillDockClass = cn(
    "pointer-events-none absolute left-0 top-0 z-[1] h-px origin-left transition-[opacity,box-shadow]",
    isDragging
      ? "opacity-100 shadow-[0_0_10px_rgba(125,191,158,0.2)]"
      : "opacity-[0.95] group-hover/player:opacity-100"
  );

  const thumbDockClass = cn(
    "pointer-events-none absolute top-0 z-[2] size-[5px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] border border-background/80 shadow-[0_0_6px_rgba(0,0,0,0.35)] transition-transform duration-150 ease-out",
    "group-hover/player:scale-110",
    isDragging && "scale-125 ring-1 ring-primary/40"
  );

  return (
    <div
      ref={railRef}
      role="slider"
      tabIndex={canSeek ? 0 : -1}
      aria-label="Пазіцыя прайгравання"
      aria-valuemin={0}
      aria-valuemax={canSeek ? Math.round(duration) : 0}
      aria-valuenow={canSeek ? Math.round(currentTime) : 0}
      aria-valuetext={
        canSeek
          ? `${formatPlayerTime(currentTime)} з ${formatPlayerTime(duration)}`
          : isPlaying
            ? "Жывы струмень"
            : "Даўжыня невядомая"
      }
      aria-disabled={!canSeek}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      data-sheet-no-gesture
      className={cn(
        "z-30 cursor-pointer touch-none select-none",
        isSheet
          ? "relative min-h-12 w-full rounded-lg"
          : "h-3 absolute inset-x-0 top-0",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/45 focus-visible:outline-offset-2 focus-visible:rounded-sm",
        !canSeek && "cursor-not-allowed",
        className
      )}
    >
      {canSeek ? (
        isSheet ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 h-7 -translate-y-1/2 px-0.5"
            aria-hidden
          >
            <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-muted/70" />
            <div
              className={cn(
                "absolute left-0 top-1/2 z-[1] h-2 -translate-y-1/2 rounded-full transition-[opacity,box-shadow]",
                isDragging ? "opacity-100 shadow-[0_0_12px_rgba(125,191,158,0.25)]" : "opacity-95"
              )}
              style={{
                width: `${pct}%`,
                ...fillStyle,
              }}
            />
            <div
              className={cn(
                "absolute top-1/2 z-[2] size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow-md transition-transform duration-150 ease-out",
                isDragging && "scale-110 ring-2 ring-primary/35"
              )}
              style={{
                left: `${pct}%`,
                ...fillStyle,
              }}
            />
          </div>
        ) : (
          <>
            <div
              className={fillDockClass}
              style={{
                width: `${pct}%`,
                ...fillStyle,
              }}
              aria-hidden
            />
            <div
              aria-hidden
              className={thumbDockClass}
              style={{
                left: `${pct}%`,
                ...fillStyle,
              }}
            />
          </>
        )
      ) : (
        <div
          className={cn(
            "pointer-events-none absolute z-[1] overflow-hidden",
            isSheet
              ? "inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-muted/50"
              : "inset-x-0 top-0 h-px"
          )}
          aria-hidden
        >
          {isPlaying ? (
            <div
              className={cn("speu-player-progress-indeterminate h-full w-[22%]", isSheet && "rounded-full")}
              style={{ background: accentColor, opacity: 0.75 }}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

export function GlobalPlayerCoverEqualizer() {
  const { accentColor } = useUiAccent();
  const color = accentColor || "rgba(255,255,255,0.92)";
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] flex h-[48%] items-end justify-center gap-[3px] bg-gradient-to-t from-black/45 to-transparent pb-1 pt-5"
      aria-hidden
    >
      {[1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] min-w-[3px] rounded-full"
          style={{ background: color }}
          animate={{ height: ["35%", "100%", "45%", "85%", "35%"] }}
          transition={{
            duration: 0.75,
            repeat: Infinity,
            delay: i * 0.12,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
