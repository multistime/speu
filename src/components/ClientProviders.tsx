"use client";

import { PlayerProvider } from "@/contexts/PlayerContext";
import { TrackLikesProvider } from "@/contexts/TrackLikesContext";
import { UiAccentProvider } from "@/contexts/UiAccentContext";
import { GlobalPlayer } from "@/components/player/GlobalPlayer";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <TrackLikesProvider>
      <UiAccentProvider>
        <PlayerProvider>
          {children}
          <GlobalPlayer />
        </PlayerProvider>
      </UiAccentProvider>
    </TrackLikesProvider>
  );
}
