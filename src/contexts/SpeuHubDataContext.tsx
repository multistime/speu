"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SpeuChartRow, SpeuHubArtistCard, SpeuPublicTrack } from "@/lib/speu/types";
import {
  loadSpeuHubFromSession,
  saveSpeuHubToSession,
  type SpeuHubPayload,
} from "@/lib/speu-hub-data-storage";

type SpeuHubDataContextValue = {
  playable: SpeuPublicTrack[];
  artists: SpeuHubArtistCard[];
  chartRows: SpeuChartRow[];
  heroDiscScale: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

const SpeuHubDataContext = createContext<SpeuHubDataContextValue | null>(null);

const EMPTY: SpeuHubPayload = {
  playable: [],
  artists: [],
  chartRows: [],
  chartSnapshotDate: null,
  heroDiscScale: 1,
};

function normalizePayload(raw: Record<string, unknown>): SpeuHubPayload {
  return {
    playable: Array.isArray(raw.playable) ? (raw.playable as SpeuPublicTrack[]) : [],
    artists: Array.isArray(raw.artists) ? (raw.artists as SpeuHubArtistCard[]) : [],
    chartRows: Array.isArray(raw.chartRows) ? (raw.chartRows as SpeuChartRow[]) : [],
    chartSnapshotDate:
      typeof raw.chartSnapshotDate === "string" ? raw.chartSnapshotDate : null,
    heroDiscScale:
      typeof raw.heroDiscScale === "number" && Number.isFinite(raw.heroDiscScale)
        ? raw.heroDiscScale
        : 1,
  };
}

export function SpeuHubDataProvider({ children }: { children: ReactNode }) {
  const cached = typeof window !== "undefined" ? loadSpeuHubFromSession() : null;
  const [data, setData] = useState<SpeuHubPayload>(cached ?? EMPTY);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const inflightRef = useRef<AbortController | null>(null);

  const fetchHub = useCallback(async (background: boolean) => {
    inflightRef.current?.abort();
    const ac = new AbortController();
    inflightRef.current = ac;
    if (!background) setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public/speu/hub", {
        signal: ac.signal,
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error(`hub_${res.status}`);
      const json = (await res.json()) as Record<string, unknown>;
      const next = normalizePayload(json);
      setData(next);
      saveSpeuHubToSession(next);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError(e instanceof Error ? e.message : "hub_failed");
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHub(Boolean(cached));
    return () => inflightRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  const value = useMemo<SpeuHubDataContextValue>(
    () => ({
      playable: data.playable,
      artists: data.artists,
      chartRows: data.chartRows,
      heroDiscScale: data.heroDiscScale,
      loading,
      error,
      refresh: () => void fetchHub(false),
    }),
    [data, loading, error, fetchHub],
  );

  return (
    <SpeuHubDataContext.Provider value={value}>{children}</SpeuHubDataContext.Provider>
  );
}

export function useSpeuHubData(): SpeuHubDataContextValue {
  const ctx = useContext(SpeuHubDataContext);
  if (!ctx) {
    throw new Error("useSpeuHubData must be used within SpeuHubDataProvider");
  }
  return ctx;
}
