/** Мінімум палёў для Media Session (супадае з PlayerTrack). */
export type MediaSessionTrackFields = {
  title: string;
  artistName?: string | null;
  coverUrl?: string | null;
  /** Калі ёсьць — паказваецца як «альбом» у Now Playing / Dynamic Island */
  albumTitle?: string | null;
};

/** iOS/Safari часта не падхопліваюць адносныя URL для artwork у фоне. */
function toAbsoluteArtworkUrl(src: string): string {
  const s = src.trim();
  if (!s) return s;
  try {
    return new URL(s, window.location.href).href;
  } catch {
    return s;
  }
}

function guessArtworkMimeType(url: string): string | undefined {
  const path = url.split("?")[0].toLowerCase();
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".gif")) return "image/gif";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  return undefined;
}

/**
 * Некалькі ўваходаў з sizes дапамагаюць WebKit/iOS выбраць якасць для lock screen і Dynamic Island.
 * Усе вядуюць на адзін absolute URL — гэта дапушчальна па спэцыфікацыі.
 */
function buildArtworkForSrc(absoluteSrc: string): MediaImage[] {
  const type = guessArtworkMimeType(absoluteSrc);
  const extra = type ? { type } : {};
  const hints = ["96x96", "128x128", "192x192", "256x256", "384x384", "512x512"] as const;
  return [
    { src: absoluteSrc, ...extra },
    ...hints.map((sizes) => ({ src: absoluteSrc, sizes, ...extra })),
  ];
}

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
  const album = track.albumTitle?.trim() || "Спеў";
  const rawCover = track.coverUrl?.trim();
  const absoluteCover = rawCover ? toAbsoluteArtworkUrl(rawCover) : "";
  const artwork: MediaImage[] =
    absoluteCover && (absoluteCover.startsWith("https:") || absoluteCover.startsWith("http:"))
      ? buildArtworkForSrc(absoluteCover)
      : [];

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title.trim() || "Трэк",
      artist,
      album,
      artwork: artwork.length > 0 ? artwork : undefined,
    });
  } catch {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title.trim() || "Трэк",
        artist,
        album,
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
