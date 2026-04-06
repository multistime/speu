"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  clearMediaSessionPositionState,
  setMediaSessionPlaybackState,
  setTrackMediaMetadata,
  updateMediaSessionPositionState,
} from "@/lib/player-media-session";
import { shuffleArray } from "@/lib/speu/shuffle";

export type PlayerTrack = {
  id: string;
  title: string;
  audioUrl: string;
  artistName?: string | null;
  coverUrl?: string | null;
  accentColor?: string | null;
  accentRgb?: string | null;
  /** Спасылка на старонку трэка ў хабе «Спеў» */
  trackHref?: string | null;
  /** Першасны артыст (slug) для спасылкі ў глабальным плэеры */
  artistSlug?: string | null;
};

type PlayerContextValue = {
  track: PlayerTrack | null;
  isPlaying: boolean;
  repeatOne: boolean;
  /** Non-stop чарга: перамешаны плэйліст цыклічна прайграецца пасля канца трэка */
  nonStopActive: boolean;
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
  /** Усе апублікаваныя трэкі з аўдыё — перамешваюцца і гуляюць бесперапынна */
  startNonStopShuffle: (tracks: PlayerTrack[]) => void;
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
  const [nonStopActive, setNonStopActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<PlayerTrack | null>(null);
  const repeatOneRef = useRef(false);

  const nonStopRef = useRef(false);
  const poolRef = useRef<PlayerTrack[]>([]);
  const queueRef = useRef<PlayerTrack[]>([]);
  const queueIndexRef = useRef(0);

  const playTrackInternalRef = useRef<(next: PlayerTrack) => void>(() => {});
  const stopRef = useRef<() => void>(() => {});
  const lastPositionUiMsRef = useRef(0);

  const playTrackInternal = useCallback((next: PlayerTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
    trackRef.current = next;
    setTrack(next);
    setCurrentTime(0);
    setDuration(0);
    setTrackMediaMetadata(next);
    clearMediaSessionPositionState();
    audio.src = next.audioUrl;
    void audio.play();
  }, []);

  useEffect(() => {
    repeatOneRef.current = repeatOne;
  }, [repeatOne]);

  useEffect(() => {
    playTrackInternalRef.current = playTrackInternal;
  }, [playTrackInternal]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const play = () => void audioRef.current?.play();
    const pause = () => audioRef.current?.pause();
    const stopFromOs = () => stopRef.current();
    try {
      navigator.mediaSession.setActionHandler("play", play);
      navigator.mediaSession.setActionHandler("pause", pause);
      navigator.mediaSession.setActionHandler("stop", stopFromOs);
    } catch {
      /* duplicate registration etc. */
    }
    return () => {
      try {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("stop", null);
      } catch {
        /* ignore */
      }
    };
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onPlay = () => {
      setIsPlaying(true);
      setMediaSessionPlaybackState("playing");
      updateMediaSessionPositionState(audio);
    };
    const onPause = () => {
      setIsPlaying(false);
      setMediaSessionPlaybackState(audio.src?.trim() ? "paused" : "none");
    };
    const onEnded = () => {
      if (repeatOneRef.current && audio.src) {
        audio.currentTime = 0;
        void audio.play();
        return;
      }
      if (nonStopRef.current && poolRef.current.length > 0) {
        let idx = queueIndexRef.current + 1;
        if (idx >= queueRef.current.length) {
          queueRef.current = shuffleArray(poolRef.current);
          idx = 0;
        }
        queueIndexRef.current = idx;
        const next = queueRef.current[idx];
        if (next) {
          playTrackInternalRef.current(next);
          return;
        }
      }
      setIsPlaying(false);
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      const d = finiteDuration(audio.duration);
      if (d > 0) setDuration(d);
      const now = Date.now();
      if (now - lastPositionUiMsRef.current > 900) {
        lastPositionUiMsRef.current = now;
        updateMediaSessionPositionState(audio);
      }
    };

    const onDurationChange = () => {
      setDuration(finiteDuration(audio.duration));
    };

    const onLoadedMetadata = () => {
      setDuration(finiteDuration(audio.duration));
      setCurrentTime(audio.currentTime);
      lastPositionUiMsRef.current = Date.now();
      updateMediaSessionPositionState(audio);
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
      setTrackMediaMetadata(null);
      clearMediaSessionPositionState();
      setMediaSessionPlaybackState("none");
    };
  }, []);

  const startNonStopShuffle = useCallback((tracks: PlayerTrack[]) => {
    const playable = tracks.filter((t) => t.audioUrl?.trim());
    if (playable.length === 0) return;
    poolRef.current = playable;
    queueRef.current = shuffleArray(playable);
    queueIndexRef.current = 0;
    nonStopRef.current = true;
    setNonStopActive(true);
    const first = queueRef.current[0];
    if (first) playTrackInternalRef.current(first);
  }, []);

  const togglePlay = useCallback((newTrack: PlayerTrack) => {
    const audio = audioRef.current;
    if (!audio) return;

    nonStopRef.current = false;
    setNonStopActive(false);

    if (trackRef.current?.id === newTrack.id) {
      if (!audio.paused) {
        audio.pause();
      } else {
        void audio.play();
      }
    } else {
      playTrackInternalRef.current(newTrack);
    }
  }, []);

  const toggleRepeatOne = useCallback(() => {
    setRepeatOne((v) => !v);
  }, []);

  const seekRatio = useCallback((ratio: number) => {
    const audio = audioRef.current;
    if (!audio?.src) return;
    const d = finiteDuration(audio.duration);
    if (d <= 0) return;
    const t = Math.min(Math.max(0, ratio), 1) * d;
    audio.currentTime = t;
    setCurrentTime(t);
    lastPositionUiMsRef.current = Date.now();
    updateMediaSessionPositionState(audio);
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = "";
    trackRef.current = null;
    nonStopRef.current = false;
    poolRef.current = [];
    queueRef.current = [];
    queueIndexRef.current = 0;
    setNonStopActive(false);
    setTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setTrackMediaMetadata(null);
    clearMediaSessionPositionState();
    setMediaSessionPlaybackState("none");
  }, []);

  useLayoutEffect(() => {
    stopRef.current = stop;
  }, [stop]);

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
        nonStopActive,
        currentTime,
        duration,
        canSeek,
        togglePlay,
        toggleRepeatOne,
        seekRatio,
        stop,
        isTrackActive,
        startNonStopShuffle,
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
