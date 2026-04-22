"use client";

import dynamic from "next/dynamic";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { TrackLikesProvider } from "@/contexts/TrackLikesContext";
import { UiAccentProvider } from "@/contexts/UiAccentContext";

const GlobalPlayer = dynamic(
  () => import("@/components/player/GlobalPlayer").then((m) => m.GlobalPlayer),
  { ssr: false },
);

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
