/** Мінімум палёў для Media Session (супадае з PlayerTrack). */
export type MediaSessionTrackFields = {
  title: string;
  artistName?: string | null;
  coverUrl?: string | null;
};

export function setTrackMediaMetadata(track: MediaSessionTrackFields | null): void {
  if (typeof window === "undefined") return;
  if (!("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;

  if (!track) {
    try {
      navigator.mediaSession.metadata = null;
    } catch {
      /* ignore */
    }
    return;
  }

  const artist = track.artistName?.trim() || "Спеў";
  const cover = track.coverUrl?.trim();
  const artwork: MediaImage[] = cover
    ? [{ src: cover }, { src: cover, sizes: "256x256" }, { src: cover, sizes: "512x512" }]
    : [];

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title.trim() || "Трэк",
      artist,
      album: "Спеў",
      artwork: artwork.length > 0 ? artwork : undefined,
    });
  } catch {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title.trim() || "Трэк",
        artist,
        album: "Спеў",
      });
    } catch {
      /* ignore */
    }
  }
}

export function setMediaSessionPlaybackState(
  state: "none" | "paused" | "playing",
): void {
  if (typeof window === "undefined") return;
  if (!("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.playbackState = state;
  } catch {
    /* ignore */
  }
}

/** Safari на iPhone часта дае (pointer: fine) — UA, platform, touch. */
function isAppleTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const platform = navigator.platform ?? "";
  if (/iPhone|iPod/i.test(ua)) return true;
  if (/iPad/i.test(ua)) return true;
  if (/^iPhone|^iPad|^iPod/i.test(platform)) return true;
  // «Запытаць сайт для Mac» / iPadOS: Macintosh + touch
  if (/Mac/i.test(platform) && navigator.maxTouchPoints > 1) return true;
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return true;
  return false;
}

/**
 * На touch lock screen (iOS, часта Android) замест трэкаў паказваюцца ±N с,
 * калі ёсць MediaSession position state. Без setPositionState — previoustrack/nexttrack.
 */
export function mediaSessionPrefersTrackButtonsOnLockScreen(): boolean {
  if (typeof window === "undefined") return false;
  if (isAppleTouchDevice()) return true;
  try {
    return window.matchMedia("(pointer: coarse)").matches;
  } catch {
    return false;
  }
}

export function updateMediaSessionPositionState(audio: HTMLAudioElement): void {
  if (typeof window === "undefined") return;
  if (mediaSessionPrefersTrackButtonsOnLockScreen()) {
    clearMediaSessionPositionState();
    return;
  }
  const ms = navigator.mediaSession;
  if (!ms || !("setPositionState" in ms)) return;
  const d = audio.duration;
  if (!Number.isFinite(d) || d <= 0) return;
  const pos = Math.min(Math.max(0, audio.currentTime), d);
  try {
    ms.setPositionState({
      duration: d,
      playbackRate: audio.playbackRate || 1,
      position: pos,
    });
  } catch {
    /* Safari / older browsers */
  }
}

export function clearMediaSessionPositionState(): void {
  if (typeof window === "undefined") return;
  const ms = navigator.mediaSession;
  if (!ms || !("setPositionState" in ms)) return;
  try {
    // Spec: null clears; lib.dom types often omit null
    (ms as unknown as { setPositionState: (p: MediaPositionState | null) => void }).setPositionState(null);
  } catch {
    /* ignore */
  }
}
