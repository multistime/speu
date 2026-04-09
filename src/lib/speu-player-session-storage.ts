/** Згодна з PlayerTrack у contexts/PlayerContext — толькі для sessionStorage (без цыклічнага імпарту). */
export type SpeuPlayerSnapshotTrack = {
  id: string;
  title: string;
  audioUrl: string;
  artistName?: string | null;
  coverUrl?: string | null;
  accentColor?: string | null;
  accentRgb?: string | null;
  trackHref?: string | null;
  artistSlug?: string | null;
  albumSlug?: string | null;
  navArtists?: { slug: string; name: string }[];
};

export type SpeuPlayerRepeatSnapshot = "off" | "all" | "one";

const SESSION_KEY = "speu-player-v1";

export type SpeuPlayerSessionV1 = {
  v: 1;
  track: SpeuPlayerSnapshotTrack | null;
  nonStop: boolean;
  pool: SpeuPlayerSnapshotTrack[];
  queue: SpeuPlayerSnapshotTrack[];
  queueIndex: number;
  repeatMode: SpeuPlayerRepeatSnapshot;
  shuffleEnabled: boolean;
  queueRepeatPref: SpeuPlayerRepeatSnapshot;
  queueShufflePref: boolean;
  singleRepeatPref: boolean;
  /** Апошні стан прайграваньня перад размантаваньнем (для аднаўленьня пасьля F5) */
  wasPlaying: boolean;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function parseRepeat(x: unknown): SpeuPlayerRepeatSnapshot | null {
  if (x === "off" || x === "all" || x === "one") return x;
  return null;
}

function parseSession(raw: string | null): SpeuPlayerSessionV1 | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || data.v !== 1) return null;
    if (!Array.isArray(data.pool) || !Array.isArray(data.queue)) return null;
    const rm = parseRepeat(data.repeatMode);
    const qrp = parseRepeat(data.queueRepeatPref);
    if (!rm || !qrp) return null;
    return {
      v: 1,
      track: (data.track ?? null) as SpeuPlayerSnapshotTrack | null,
      nonStop: Boolean(data.nonStop),
      pool: data.pool as SpeuPlayerSnapshotTrack[],
      queue: data.queue as SpeuPlayerSnapshotTrack[],
      queueIndex: typeof data.queueIndex === "number" && Number.isFinite(data.queueIndex) ? data.queueIndex : 0,
      repeatMode: rm,
      shuffleEnabled: Boolean(data.shuffleEnabled),
      queueRepeatPref: qrp,
      queueShufflePref: Boolean(data.queueShufflePref),
      singleRepeatPref: Boolean(data.singleRepeatPref),
      wasPlaying: Boolean(data.wasPlaying),
    };
  } catch {
    return null;
  }
}

export function loadSpeuPlayerSession(): SpeuPlayerSessionV1 | null {
  if (typeof window === "undefined") return null;
  try {
    return parseSession(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function saveSpeuPlayerSession(payload: SpeuPlayerSessionV1 | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!payload?.track) {
      sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* квота / прыватны рэжым */
  }
}

export function clearSpeuPlayerSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
