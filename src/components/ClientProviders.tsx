"use client";

import { PlayerProvider } from "@/contexts/PlayerContext";
import { TrackLikesProvider } from "@/contexts/TrackLikesContext";
import { GlobalPlayer } from "@/components/player/GlobalPlayer";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <TrackLikesProvider>
      <PlayerProvider>
        {children}
        <GlobalPlayer />
      </PlayerProvider>
    </TrackLikesProvider>
  );
}
