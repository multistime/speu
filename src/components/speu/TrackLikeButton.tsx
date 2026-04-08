"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrackLikes } from "@/contexts/TrackLikesContext";

type TrackLikeButtonProps = {
  trackId: string;
  className?: string;
  /** sm — у радку трэка; md — на старонцы трэка / плэеры */
  size?: "sm" | "md";
  accentColor?: string | null;
  /** Пасля паспяховага toggle — агульны лік лайкаў з сервера */
  onLikeCount?: (count: number) => void;
};

export function TrackLikeButton({
  trackId,
  className,
  size = "sm",
  accentColor,
  onLikeCount,
}: TrackLikeButtonProps) {
  const { isLiked, toggleLike, authReady } = useTrackLikes();
  const liked = isLiked(trackId);

  const iconClass = size === "md" ? "size-[1.15rem]" : "size-3.5";
  const pad = size === "md" ? "p-3" : "p-1.5";

  return (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const c = await toggleLike(trackId);
        if (c != null) onLikeCount?.(c);
      }}
      onKeyDown={(e) => e.stopPropagation()}
      disabled={!authReady}
      aria-pressed={liked}
      aria-label={liked ? "Зняць лайк" : "Паставіць лайк"}
      className={cn(
        "box-border inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-transparent transition-colors",
        "hover:bg-muted/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40",
        liked && !accentColor && "text-rose-500",
        !liked && "text-muted-foreground hover:text-foreground",
        pad,
        className
      )}
      style={liked && accentColor ? { color: accentColor } : undefined}
    >
      <Heart
        className={cn("pointer-events-none shrink-0", iconClass, liked && "fill-current")}
        strokeWidth={liked ? 0 : 1.5}
      />
    </button>
  );
}
