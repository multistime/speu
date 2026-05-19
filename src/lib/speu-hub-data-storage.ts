import type { SpeuChartRow, SpeuHubArtistCard, SpeuPublicTrack } from "@/lib/speu/types";

export type SpeuHubPayload = {
  playable: SpeuPublicTrack[];
  artists: SpeuHubArtistCard[];
  chartRows: SpeuChartRow[];
  chartSnapshotDate: string | null;
  heroDiscScale: number;
};

const STORAGE_KEY = "speu-hub-data-v1";
const TTL_MS = 5 * 60 * 1000;

type Stored = {
  savedAt: number;
  data: SpeuHubPayload;
};

export function loadSpeuHubFromSession(): SpeuHubPayload | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed?.data?.playable || Date.now() - parsed.savedAt > TTL_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function saveSpeuHubToSession(data: SpeuHubPayload): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const stored: Stored = { savedAt: Date.now(), data };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    /* quota */
  }
}
