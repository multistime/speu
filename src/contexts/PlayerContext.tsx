"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type PlayerTrack = {
  id: string;
  title: string;
  audioUrl: string;
  artistName?: string | null;
  coverUrl?: string | null;
  accentColor?: string | null;
  accentRgb?: string | null;
};

type PlayerContextValue = {
  track: PlayerTrack | null;
  isPlaying: boolean;
  togglePlay: (track: PlayerTrack) => void;
  stop: () => void;
  isTrackActive: (id: string) => boolean;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [track, setTrack] = useState<PlayerTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<PlayerTrack | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.src = "";
    };
  }, []);

  const togglePlay = useCallback((newTrack: PlayerTrack) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (trackRef.current?.id === newTrack.id) {
      if (!audio.paused) {
        audio.pause();
      } else {
        void audio.play();
      }
    } else {
      trackRef.current = newTrack;
      setTrack(newTrack);
      audio.src = newTrack.audioUrl;
      void audio.play();
    }
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = "";
    trackRef.current = null;
    setTrack(null);
    setIsPlaying(false);
  }, []);

  const isTrackActive = useCallback(
    (id: string) => trackRef.current?.id === id,
    []
  );

  return (
    <PlayerContext.Provider value={{ track, isPlaying, togglePlay, stop, isTrackActive }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
