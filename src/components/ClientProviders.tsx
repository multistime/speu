"use client";

import dynamic from "next/dynamic";
import { SerwistProvider } from "@serwist/next/react";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { TrackLikesProvider } from "@/contexts/TrackLikesContext";
import { UiAccentProvider } from "@/contexts/UiAccentContext";
import { SpeuHubDataProvider } from "@/contexts/SpeuHubDataContext";
import { SpeuMobileChromeProvider } from "@/contexts/SpeuMobileChromeContext";

const GlobalPlayer = dynamic(
  () => import("@/components/player/GlobalPlayer").then((m) => m.GlobalPlayer),
  { ssr: false },
);

const registerSw = process.env.NODE_ENV === "production";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SpeuMobileChromeProvider>
      <SerwistProvider swUrl="/sw.js" disable={!registerSw}>
        <SpeuHubDataProvider>
          <TrackLikesProvider>
            <UiAccentProvider>
              <PlayerProvider>
                {children}
                <GlobalPlayer />
              </PlayerProvider>
            </UiAccentProvider>
          </TrackLikesProvider>
        </SpeuHubDataProvider>
      </SerwistProvider>
    </SpeuMobileChromeProvider>
  );
}
