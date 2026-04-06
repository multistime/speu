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
};

export function TrackLikeButton({
  trackId,
  className,
  size = "sm",
  accentColor,
}: TrackLikeButtonProps) {
  const { isLiked, toggleLike, authReady } = useTrackLikes();
  const liked = isLiked(trackId);

  const iconClass = size === "md" ? "size-5" : "size-4";
  const pad = size === "md" ? "p-3" : "p-1.5";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleLike(trackId);
      }}
      onKeyDown={(e) => e.stopPropagation()}
      disabled={!authReady}
      aria-pressed={liked}
      aria-label={liked ? "Зняць лайк" : "Паставіць лайк"}
      className={cn(
        "rounded-lg border border-transparent shrink-0 transition-colors",
        "hover:bg-muted/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40",
        liked && !accentColor && "text-rose-500",
        !liked && "text-muted-foreground hover:text-foreground",
        pad,
        className
      )}
      style={liked && accentColor ? { color: accentColor } : undefined}
    >
      <Heart className={cn(iconClass, liked && "fill-current")} strokeWidth={liked ? 0 : 1.75} />
    </button>
  );
}
