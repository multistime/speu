"use client";

import { PlayerProvider } from "@/contexts/PlayerContext";
import { GlobalPlayer } from "@/components/player/GlobalPlayer";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      {children}
      <GlobalPlayer />
    </PlayerProvider>
  );
}
