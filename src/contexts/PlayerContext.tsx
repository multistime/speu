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
  mediaSessionPrefersTrackButtonsOnLockScreen,
  setMediaSessionPlaybackState,
  setTrackMediaMetadata,
  updateMediaSessionPositionState,
} from "@/lib/player-media-session";
import { submitListenTerminal } from "@/lib/listen-analytics/submit";
import { createClient } from "@/lib/supabase/client";
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
  /** Суседнія трэкі ў чарзе для UI (карусель абкладак); null калі няма куды пераходзіць */
  queueNeighborTracks: { prev: PlayerTrack | null; next: PlayerTrack | null };
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
  /** Папярэдні трэк у чарзе без «>3 с → пачатак» (карусель, жэсты шторкі) */
  skipToPreviousInQueue: () => void;
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

  const listenSessionIdRef = useRef<string | null>(null);
  const listenMaxPosSecRef = useRef(0);
  const listenDurationSecRef = useRef(0);
  const listenHadUserSeekRef = useRef(false);
  const listenHadUserPauseRef = useRef(false);
  const listenShortGapRef = useRef(0);
  const finalizeListenSessionRef = useRef<(beacon: boolean) => void>(() => {});

  /** Захаваныя перавагі (чарга / адзіночны трэк); па змаўчанні: паўтор чаргі ўкл, shuffle выкл */
  const queueRepeatPrefRef = useRef<PlayerRepeatMode>("all");
  const queueShufflePrefRef = useRef(false);
  const singleRepeatPrefRef = useRef(false);
  const authedRef = useRef(false);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushPersist = useCallback(() => {
    if (!authedRef.current) return;
    void fetch("/api/user/player-prefs", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player_queue_repeat_mode: queueRepeatPrefRef.current,
        player_queue_shuffle: queueShufflePrefRef.current,
        player_single_repeat: singleRepeatPrefRef.current,
      }),
    });
  }, []);

  const schedulePersist = useCallback(() => {
    if (!authedRef.current) return;
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      persistTimerRef.current = null;
      flushPersist();
    }, 500);
  }, [flushPersist]);

  const finalizeListenSession = useCallback((beacon: boolean) => {
    const sid = listenSessionIdRef.current;
    const tr = trackRef.current;
    const audio = audioRef.current;
    if (!sid || !tr?.id) return;
    listenSessionIdRef.current = null;
    const dFromAudio = finiteDuration(audio?.duration ?? 0);
    const dSec = dFromAudio > 0 ? dFromAudio : finiteDuration(listenDurationSecRef.current);
    const durationMs = Math.round(dSec * 1000);
    if (durationMs < 1000) return;
    const maxSec = Math.max(
      listenMaxPosSecRef.current,
      finiteDuration(audio?.currentTime ?? 0)
    );
    let maxPositionMs = Math.round(maxSec * 1000);
    if (maxPositionMs > durationMs + 2500) maxPositionMs = durationMs + 2500;
    submitListenTerminal(
      {
        listeningSessionId: sid,
        trackId: tr.id,
        durationMs,
        maxPositionMs,
        hadUserSeek: listenHadUserSeekRef.current,
        hadUserPause: listenHadUserPauseRef.current,
        shortGapCount: listenShortGapRef.current,
      },
      beacon
    );
    listenHadUserSeekRef.current = false;
    listenHadUserPauseRef.current = false;
    listenShortGapRef.current = 0;
    listenMaxPosSecRef.current = 0;
  }, []);

  useLayoutEffect(() => {
    finalizeListenSessionRef.current = finalizeListenSession;
  }, [finalizeListenSession]);

  const playTrackInternal = useCallback((next: PlayerTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
    finalizeListenSessionRef.current(false);
    ignoreNextPauseRef.current = true;
    listenSessionIdRef.current =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    listenMaxPosSecRef.current = 0;
    listenHadUserSeekRef.current = false;
    listenHadUserPauseRef.current = false;
    listenShortGapRef.current = 0;
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
    listenDurationSecRef.current = finiteDuration(duration);
  }, [duration]);

  useEffect(() => {
    const onHide = () => finalizeListenSessionRef.current(true);
    if (typeof window === "undefined") return;
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const applyProfile = (row: Record<string, unknown> | null) => {
      if (!row || cancelled) return;
      const qr = row.player_queue_repeat_mode;
      if (qr === "off" || qr === "all" || qr === "one") {
        queueRepeatPrefRef.current = qr;
      }
      if (typeof row.player_queue_shuffle === "boolean") {
        queueShufflePrefRef.current = row.player_queue_shuffle;
      }
      if (typeof row.player_single_repeat === "boolean") {
        singleRepeatPrefRef.current = row.player_single_repeat;
      }
    };

    void supabase.auth.getSession().then(({ data: { session } }) => {
      authedRef.current = Boolean(session?.user);
      if (!session?.user) return;
      void fetch("/api/user/profile", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then(applyProfile)
        .catch(() => {});
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      authedRef.current = Boolean(session?.user);
      if (session?.user) {
        void fetch("/api/user/profile", { credentials: "include" })
          .then((r) => (r.ok ? r.json() : null))
          .then(applyProfile)
          .catch(() => {});
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
        if (authedRef.current) flushPersist();
      }
    };
  }, [flushPersist]);

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
    // iOS: нельга сумяшчаць seek± і трэкі — здымаем seek, каб на lock screen былі |◀ ▶|
    if (mediaSessionPrefersTrackButtonsOnLockScreen()) {
      for (const action of ["seekbackward", "seekforward", "seekto"] as const) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          /* action не падтрымліваецца */
        }
      }
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
      if (mediaSessionPrefersTrackButtonsOnLockScreen()) {
        for (const action of ["seekbackward", "seekforward", "seekto"] as const) {
          try {
            navigator.mediaSession.setActionHandler(action, null);
          } catch {
            /* ignore */
          }
        }
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
        finalizeListenSessionRef.current(false);
        listenSessionIdRef.current =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        listenMaxPosSecRef.current = 0;
        listenHadUserSeekRef.current = false;
        listenHadUserPauseRef.current = false;
        listenShortGapRef.current = 0;
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
      finalizeListenSessionRef.current(false);
      setIsPlaying(false);
    };

    const onWaiting = () => {
      if (!ignoreNextPauseRef.current) {
        listenShortGapRef.current = Math.min(5, listenShortGapRef.current + 1);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      listenMaxPosSecRef.current = Math.max(listenMaxPosSecRef.current, audio.currentTime);
      const d = finiteDuration(audio.duration);
      if (d > 0) {
        setDuration(d);
        listenDurationSecRef.current = d;
      }
      const now = Date.now();
      if (now - lastPositionUiMsRef.current > 900) {
        lastPositionUiMsRef.current = now;
        updateMediaSessionPositionState(audio);
      }
    };

    const onDurationChange = () => {
      const d = finiteDuration(audio.duration);
      setDuration(d);
      listenDurationSecRef.current = d;
    };

    const onLoadedMetadata = () => {
      const d = finiteDuration(audio.duration);
      setDuration(d);
      listenDurationSecRef.current = d;
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
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.src = "";
      setTrackMediaMetadata(null);
      clearMediaSessionPositionState();
      setMediaSessionPlaybackState("none");
    };
  }, []);

  const startNonStopShuffle = useCallback(
    (tracks: PlayerTrack[]) => {
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
      queueShufflePrefRef.current = true;
      schedulePersist();
      repeatAllRef.current = true;
      repeatOneRef.current = false;
      setRepeatMode("all");
      const first = queueRef.current[0];
      if (first) playTrackInternalRef.current(first);
    },
    [schedulePersist]
  );

  const playPlaylistAt = useCallback((raw: PlayerTrack[], startIndex: number) => {
    const pool = raw.filter((t) => t.audioUrl?.trim());
    if (pool.length === 0) return;
    const target = raw[startIndex];
    if (!target?.audioUrl?.trim()) return;

    const qr = queueRepeatPrefRef.current;
    const qs = queueShufflePrefRef.current;

    poolRef.current = pool;
    queueRef.current = qs ? shuffleArray(pool) : [...pool];
    const qIdx = Math.max(
      0,
      queueRef.current.findIndex((t) => t.id === target.id)
    );
    queueIndexRef.current = qIdx;
    nonStopRef.current = true;
    setNonStopActive(true);
    setQueueSize(pool.length);
    shuffleEnabledRef.current = qs;
    setShuffleEnabled(qs);
    repeatAllRef.current = qr === "all";
    repeatOneRef.current = qr === "one";
    setRepeatMode(qr);

    const first = queueRef.current[qIdx];
    if (first) playTrackInternalRef.current(first);
  }, []);

  const togglePlay = useCallback((newTrack: PlayerTrack) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (trackRef.current?.id === newTrack.id) {
      if (!audio.paused) {
        listenHadUserPauseRef.current = true;
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
    const solo: PlayerRepeatMode = singleRepeatPrefRef.current ? "one" : "off";
    repeatAllRef.current = false;
    repeatOneRef.current = solo === "one";
    setRepeatMode(solo);

    playTrackInternalRef.current(newTrack);
  }, []);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((m) => {
      const hasQueue = nonStopRef.current && poolRef.current.length > 0;
      if (!hasQueue) {
        const next: PlayerRepeatMode = m === "off" ? "one" : "off";
        singleRepeatPrefRef.current = next === "one";
        schedulePersist();
        return next;
      }
      let next: PlayerRepeatMode;
      if (m === "off") next = "all";
      else if (m === "all") next = "one";
      else next = "off";
      queueRepeatPrefRef.current = next;
      schedulePersist();
      return next;
    });
  }, [schedulePersist]);

  const seekRatio = useCallback((ratio: number) => {
    listenHadUserSeekRef.current = true;
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
    finalizeListenSessionRef.current(false);
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
    const len = queueRef.current.length;
    let idx = queueIndexRef.current + 1;
    if (idx >= len) {
      if (repeatOneRef.current && len === 1) {
        seekRatioRef.current(0);
        void audio.play();
        return;
      }
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

  const skipToPreviousInQueue = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!nonStopRef.current || poolRef.current.length === 0) {
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
    queueShufflePrefRef.current = next;
    schedulePersist();
    queueRef.current = next ? shuffleArray(poolRef.current) : [...poolRef.current];
    queueIndexRef.current = Math.max(
      0,
      queueRef.current.findIndex((t) => t.id === current.id)
    );
  }, [schedulePersist]);

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

  /** Суседзі для каруселі вокладак: пры паўторы ўсёй чаргі — цыклічна; пры паўторы аднаго і адным трэку — той жа трэк з бакоў */
  const [queueNeighborTracks, setQueueNeighborTracks] = useState<{
    prev: PlayerTrack | null;
    next: PlayerTrack | null;
  }>({ prev: null, next: null });

  /* eslint-disable react-hooks/set-state-in-effect -- суседзі з queueRef у refs; публікуем у state для бяспечнага кантэксту */
  useLayoutEffect(() => {
    if (!nonStopActive || queueSize < 1) {
      setQueueNeighborTracks({ prev: null, next: null });
      return;
    }
    const q = queueRef.current;
    const idx = queueIndexRef.current;
    const len = q.length;
    if (len < 1) {
      setQueueNeighborTracks({ prev: null, next: null });
      return;
    }

    if (repeatMode === "all" && len >= 2) {
      setQueueNeighborTracks({
        prev: q[(idx - 1 + len) % len] ?? null,
        next: q[(idx + 1) % len] ?? null,
      });
      return;
    }

    if (repeatMode === "one" && len === 1) {
      const only = q[0] ?? null;
      setQueueNeighborTracks({ prev: only, next: only });
      return;
    }

    if (len < 2) {
      setQueueNeighborTracks({ prev: null, next: null });
      return;
    }
    setQueueNeighborTracks({
      prev: idx > 0 ? (q[idx - 1] ?? null) : null,
      next: idx < len - 1 ? (q[idx + 1] ?? null) : null,
    });
  }, [nonStopActive, queueSize, track?.id, shuffleEnabled, repeatMode]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <PlayerContext.Provider
      value={{
        track,
        isPlaying,
        repeatMode,
        shuffleEnabled,
        nonStopActive,
        queueSize,
        queueNeighborTracks,
        currentTime,
        duration,
        canSeek,
        togglePlay,
        cycleRepeatMode,
        toggleShuffle,
        skipNext,
        skipPrevious,
        skipToPreviousInQueue,
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
