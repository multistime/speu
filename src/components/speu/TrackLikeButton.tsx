"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrackLikes } from "@/contexts/TrackLikesContext";

type TrackLikeButtonProps = {
  trackId: string;
  className?: string;
  /** sm — у радку трэка; md — на старонцы трэка; lg — плэер (крупнае сэрца, без рамкі з боку className) */
  size?: "sm" | "md" | "lg";
  accentColor?: string | null;
  /** Бягучы агульны лік (для аптымістычнага +1 / −1 на старонцы трэка) */
  likeCount?: number;
  /** Пасля toggle — канчатковы лік з сервера; пры памылцы адкат да папярэдняга */
  onLikeCount?: (count: number) => void;
};

export function TrackLikeButton({
  trackId,
  className,
  size = "sm",
  accentColor,
  likeCount: displayLikeCount,
  onLikeCount,
}: TrackLikeButtonProps) {
  const { isLiked, toggleLike, authReady, user, isLikeRequestInFlight } = useTrackLikes();
  const liked = isLiked(trackId);

  const iconClass =
    size === "lg" ? "size-[1.45rem]" : size === "md" ? "size-[1.15rem]" : "size-3.5";
  const pad = size === "lg" ? "p-0" : size === "md" ? "p-3" : "p-1.5";

  return (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!user) {
          void toggleLike(trackId);
          return;
        }
        if (isLikeRequestInFlight(trackId)) return;

        const wasLiked = isLiked(trackId);
        const prevCount = displayLikeCount;

        if (onLikeCount != null && displayLikeCount !== undefined) {
          onLikeCount(Math.max(0, displayLikeCount + (wasLiked ? -1 : 1)));
        }

        const c = await toggleLike(trackId);
        if (c != null) {
          onLikeCount?.(c);
        } else if (displayLikeCount !== undefined && onLikeCount != null) {
          onLikeCount(prevCount!);
        }
      }}
      onKeyDown={(e) => e.stopPropagation()}
      disabled={!authReady}
      aria-pressed={liked}
      aria-label={liked ? "Зняць лайк" : "Паставіць лайк"}
      className={cn(
        "box-border inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border-0 border-transparent transition-colors",
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
        strokeWidth={liked ? 0 : size === "lg" ? 1.75 : 1.5}
      />
    </button>
  );
}
