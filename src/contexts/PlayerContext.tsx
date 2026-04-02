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
  repeatOne: boolean;
  /** Прайграванне, с */
  currentTime: number;
  /** Вядомая даўжыньня трэка, с; 0 калі яшчэ невядома / бясконцысьць */
  duration: number;
  /** Можна перамотваць (ёсьць канечная даўжыньня) */
  canSeek: boolean;
  togglePlay: (track: PlayerTrack) => void;
  toggleRepeatOne: () => void;
  /** Пазіцыя 0…1 */
  seekRatio: (ratio: number) => void;
  stop: () => void;
  isTrackActive: (id: string) => boolean;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

function finiteDuration(d: number): number {
  if (!Number.isFinite(d) || d <= 0) return 0;
  return d;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [track, setTrack] = useState<PlayerTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatOne, setRepeatOne] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<PlayerTrack | null>(null);
  const repeatOneRef = useRef(false);
  repeatOneRef.current = repeatOne;

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      if (repeatOneRef.current && audio.src) {
        audio.currentTime = 0;
        void audio.play();
        return;
      }
      setIsPlaying(false);
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      const d = finiteDuration(audio.duration);
      if (d > 0) setDuration(d);
    };

    const onDurationChange = () => {
      setDuration(finiteDuration(audio.duration));
    };

    const onLoadedMetadata = () => {
      setDuration(finiteDuration(audio.duration));
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
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
      setCurrentTime(0);
      setDuration(0);
      audio.src = newTrack.audioUrl;
      void audio.play();
    }
  }, []);

  const toggleRepeatOne = useCallback(() => {
    setRepeatOne((v) => !v);
  }, []);

  const seekRatio = useCallback(
    (ratio: number) => {
      const audio = audioRef.current;
      if (!audio?.src) return;
      const d = finiteDuration(audio.duration);
      if (d <= 0) return;
      const t = Math.min(Math.max(0, ratio), 1) * d;
      audio.currentTime = t;
      setCurrentTime(t);
    },
    []
  );

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = "";
    trackRef.current = null;
    setTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const isTrackActive = useCallback(
    (id: string) => trackRef.current?.id === id,
    []
  );

  const canSeek = duration > 0;

  return (
    <PlayerContext.Provider
      value={{
        track,
        isPlaying,
        repeatOne,
        currentTime,
        duration,
        canSeek,
        togglePlay,
        toggleRepeatOne,
        seekRatio,
        stop,
        isTrackActive,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
