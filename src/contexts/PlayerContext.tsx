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
  /** Альбом для мабільнага меню навігацыі */
  albumSlug?: string | null;
  /** Усе артысты (меню «⋯» на мабільным) */
  navArtists?: { slug: string; name: string }[];
};

/** Паўтор: выкл → уся чарга → адзін трэк → выкл (без чаргі: выкл ↔ адзін трэк) */
export type PlayerRepeatMode = "off" | "all" | "one";

type PlayerContextValue = {
  track: PlayerTrack | null;
  isPlaying: boolean;
  repeatMode: PlayerRepeatMode;
  shuffleEnabled: boolean;
  /** Non-stop чарга: перамешаны плэйліст цыклічна прайграецца пасля канца трэка */
  nonStopActive: boolean;
  queueSize: number;
  /** Прайграванне, с */
  currentTime: number;
  /** Вядомая даўжыньня трэка, с; 0 калі яшчэ невядома / бясконцысьць */
  duration: number;
  /** Можна перамотваць (ёсьць канечная даўжыньня) */
  canSeek: boolean;
  togglePlay: (track: PlayerTrack) => void;
  cycleRepeatMode: () => void;
  toggleShuffle: () => void;
  skipNext: () => void;
  skipPrevious: () => void;
  /** Пазіцыя 0…1 */
  seekRatio: (ratio: number) => void;
  stop: () => void;
  isTrackActive: (id: string) => boolean;
  /** Усе апублікаваныя трэкі з аўдыё — перамешваюцца і гуляюць бесперапынна */
  startNonStopShuffle: (tracks: PlayerTrack[]) => void;
  playPlaylistAt: (tracks: PlayerTrack[], startIndex: number) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

function finiteDuration(d: number): number {
  if (!Number.isFinite(d) || d <= 0) return 0;
  return d;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [track, setTrack] = useState<PlayerTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatMode, setRepeatMode] = useState<PlayerRepeatMode>("off");
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [nonStopActive, setNonStopActive] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<PlayerTrack | null>(null);
  const repeatOneRef = useRef(false);
  const repeatAllRef = useRef(false);
  const shuffleEnabledRef = useRef(false);

  const nonStopRef = useRef(false);
  const poolRef = useRef<PlayerTrack[]>([]);
  const queueRef = useRef<PlayerTrack[]>([]);
  const queueIndexRef = useRef(0);

  const playTrackInternalRef = useRef<(next: PlayerTrack) => void>(() => {});
  const stopRef = useRef<() => void>(() => {});
  const seekRatioRef = useRef<(ratio: number) => void>(() => {});
  const skipNextRef = useRef<() => void>(() => {});
  const skipPreviousRef = useRef<() => void>(() => {});
  const lastPositionUiMsRef = useRef(0);
  /** Прапускаем адзін «pause» пры змене src, каб UI не мігаў паміж трэкамі ў чарзе */
  const ignoreNextPauseRef = useRef(false);

  const playTrackInternal = useCallback((next: PlayerTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
    ignoreNextPauseRef.current = true;
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
    repeatOneRef.current = repeatMode === "one";
    repeatAllRef.current = repeatMode === "all";
  }, [repeatMode]);

  useEffect(() => {
    shuffleEnabledRef.current = shuffleEnabled;
  }, [shuffleEnabled]);

  useEffect(() => {
    playTrackInternalRef.current = playTrackInternal;
  }, [playTrackInternal]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const play = () => void audioRef.current?.play();
    const pause = () => audioRef.current?.pause();
    const stopFromOs = () => stopRef.current();
    const next = () => skipNextRef.current();
    const prev = () => skipPreviousRef.current();
    try {
      navigator.mediaSession.setActionHandler("play", play);
      navigator.mediaSession.setActionHandler("pause", pause);
      navigator.mediaSession.setActionHandler("stop", stopFromOs);
      navigator.mediaSession.setActionHandler("previoustrack", prev);
      navigator.mediaSession.setActionHandler("nexttrack", next);
    } catch {
      /* duplicate registration etc. */
    }
    return () => {
      try {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("stop", null);
        navigator.mediaSession.setActionHandler("previoustrack", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
      } catch {
        /* ignore */
      }
    };
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onPlay = () => {
      ignoreNextPauseRef.current = false;
      setIsPlaying(true);
      setMediaSessionPlaybackState("playing");
      updateMediaSessionPositionState(audio);
    };
    const onPause = () => {
      if (ignoreNextPauseRef.current) return;
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
        const len = queueRef.current.length;
        let idx = queueIndexRef.current + 1;
        if (idx >= len) {
          if (!repeatAllRef.current) {
            setIsPlaying(false);
            return;
          }
          if (shuffleEnabledRef.current) {
            queueRef.current = shuffleArray(poolRef.current);
            idx = 0;
          } else {
            idx = 0;
          }
        }
        queueIndexRef.current = idx;
        const nextTr = queueRef.current[idx];
        if (nextTr) {
          playTrackInternalRef.current(nextTr);
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

    const onError = () => {
      ignoreNextPauseRef.current = false;
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("error", onError);
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
    setQueueSize(playable.length);
    shuffleEnabledRef.current = true;
    setShuffleEnabled(true);
    repeatAllRef.current = true;
    repeatOneRef.current = false;
    setRepeatMode("all");
    const first = queueRef.current[0];
    if (first) playTrackInternalRef.current(first);
  }, []);

  const playPlaylistAt = useCallback((raw: PlayerTrack[], startIndex: number) => {
    const pool = raw.filter((t) => t.audioUrl?.trim());
    if (pool.length === 0) return;
    const target = raw[startIndex];
    if (!target?.audioUrl?.trim()) return;

    poolRef.current = pool;
    queueRef.current = [...pool];
    const qIdx = Math.max(
      0,
      queueRef.current.findIndex((t) => t.id === target.id)
    );
    queueIndexRef.current = qIdx;
    nonStopRef.current = true;
    setNonStopActive(true);
    setQueueSize(pool.length);
    shuffleEnabledRef.current = false;
    setShuffleEnabled(false);
    repeatAllRef.current = false;
    repeatOneRef.current = false;
    setRepeatMode("off");

    const first = queueRef.current[qIdx];
    if (first) playTrackInternalRef.current(first);
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
      return;
    }

    nonStopRef.current = false;
    setNonStopActive(false);
    poolRef.current = [];
    queueRef.current = [];
    queueIndexRef.current = 0;
    setQueueSize(0);
    shuffleEnabledRef.current = false;
    setShuffleEnabled(false);
    repeatAllRef.current = false;
    repeatOneRef.current = false;
    setRepeatMode("off");

    playTrackInternalRef.current(newTrack);
  }, []);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((m) => {
      const hasQueue = nonStopRef.current && poolRef.current.length > 0;
      if (!hasQueue) {
        return m === "off" ? "one" : "off";
      }
      if (m === "off") return "all";
      if (m === "all") return "one";
      return "off";
    });
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

  useLayoutEffect(() => {
    seekRatioRef.current = seekRatio;
  }, [seekRatio]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    ignoreNextPauseRef.current = false;
    audio.pause();
    audio.src = "";
    trackRef.current = null;
    nonStopRef.current = false;
    poolRef.current = [];
    queueRef.current = [];
    queueIndexRef.current = 0;
    setNonStopActive(false);
    setQueueSize(0);
    shuffleEnabledRef.current = false;
    setShuffleEnabled(false);
    repeatAllRef.current = false;
    repeatOneRef.current = false;
    setRepeatMode("off");
    setTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setTrackMediaMetadata(null);
    clearMediaSessionPositionState();
    setMediaSessionPlaybackState("none");
  }, []);

  const skipNext = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !nonStopRef.current || poolRef.current.length === 0) return;
    let idx = queueIndexRef.current + 1;
    if (idx >= queueRef.current.length) {
      if (!repeatAllRef.current) {
        audio.pause();
        return;
      }
      if (shuffleEnabledRef.current) {
        queueRef.current = shuffleArray(poolRef.current);
        idx = 0;
      } else {
        idx = 0;
      }
    }
    queueIndexRef.current = idx;
    const nextTr = queueRef.current[idx];
    if (nextTr) playTrackInternalRef.current(nextTr);
  }, []);

  const skipPrevious = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!nonStopRef.current || poolRef.current.length === 0) {
      seekRatioRef.current(0);
      return;
    }
    if (audio.currentTime > 3) {
      seekRatioRef.current(0);
      return;
    }
    let idx = queueIndexRef.current - 1;
    if (idx < 0) {
      if (!repeatAllRef.current) {
        seekRatioRef.current(0);
        return;
      }
      idx = queueRef.current.length - 1;
    }
    queueIndexRef.current = idx;
    const prevTr = queueRef.current[idx];
    if (prevTr) playTrackInternalRef.current(prevTr);
  }, []);

  const toggleShuffle = useCallback(() => {
    if (!nonStopRef.current || poolRef.current.length < 2) return;
    const current = trackRef.current;
    if (!current) return;
    const next = !shuffleEnabledRef.current;
    shuffleEnabledRef.current = next;
    setShuffleEnabled(next);
    queueRef.current = next ? shuffleArray(poolRef.current) : [...poolRef.current];
    queueIndexRef.current = Math.max(
      0,
      queueRef.current.findIndex((t) => t.id === current.id)
    );
  }, []);

  useLayoutEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  useLayoutEffect(() => {
    skipNextRef.current = skipNext;
  }, [skipNext]);

  useLayoutEffect(() => {
    skipPreviousRef.current = skipPrevious;
  }, [skipPrevious]);

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
        repeatMode,
        shuffleEnabled,
        nonStopActive,
        queueSize,
        currentTime,
        duration,
        canSeek,
        togglePlay,
        cycleRepeatMode,
        toggleShuffle,
        skipNext,
        skipPrevious,
        seekRatio,
        stop,
        isTrackActive,
        startNonStopShuffle,
        playPlaylistAt,
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
