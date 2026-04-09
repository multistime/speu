export type ArtistListenDailyPoint = {
  d: string;
  full: number;
  partial: number;
};

export type ArtistListenTrackRow = {
  id: string;
  title: string;
  slug: string | null;
  like_count: number;
  period_full: number;
  period_partial: number;
  all_full: number;
  all_partial: number;
};

export type ArtistListenSummary = {
  full_listens: number;
  partial_listens: number;
  total_sessions: number;
  unique_listeners: number;
  prev_full_listens: number;
  prev_partial_listens: number;
  prev_total_sessions: number;
  prev_unique_listeners: number;
};

/** Дадатковыя лічбы для агляду лэйбла (RPC label_listen_dashboard). */
export type LabelCatalogSnapshot = {
  artists_total: number;
  artists_published: number;
  tracks_total: number;
  albums_total: number;
  releases_in_moderation: number;
};

export type ArtistListenDashboardOk = {
  ok: true;
  period_days: number;
  range: { start: string; end: string };
  prev_range: { start: string; end: string };
  summary: ArtistListenSummary;
  daily: ArtistListenDailyPoint[];
  tracks: ArtistListenTrackRow[];
  catalog?: LabelCatalogSnapshot;
};

export type ArtistListenDashboardErr = {
  ok: false;
  error: string;
};

export type ArtistListenDashboard = ArtistListenDashboardOk | ArtistListenDashboardErr;

export function parseArtistListenDashboard(raw: unknown): ArtistListenDashboard | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.ok !== true) {
    if (o.ok === false && typeof o.error === "string") {
      return { ok: false, error: o.error };
    }
    return null;
  }
  const summary = o.summary;
  if (!summary || typeof summary !== "object") return null;
  const s = summary as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

  let catalog: LabelCatalogSnapshot | undefined;
  if (o.catalog && typeof o.catalog === "object") {
    const c = o.catalog as Record<string, unknown>;
    catalog = {
      artists_total: num(c.artists_total),
      artists_published: num(c.artists_published),
      tracks_total: num(c.tracks_total),
      albums_total: num(c.albums_total),
      releases_in_moderation: num(c.releases_in_moderation),
    };
  }

  return {
    ok: true,
    period_days: num(o.period_days) || 28,
    range: {
      start: typeof o.range === "object" && o.range && "start" in (o.range as object)
        ? String((o.range as { start: unknown }).start)
        : "",
      end: typeof o.range === "object" && o.range && "end" in (o.range as object)
        ? String((o.range as { end: unknown }).end)
        : "",
    },
    prev_range: {
      start:
        typeof o.prev_range === "object" && o.prev_range && "start" in (o.prev_range as object)
          ? String((o.prev_range as { start: unknown }).start)
          : "",
      end:
        typeof o.prev_range === "object" && o.prev_range && "end" in (o.prev_range as object)
          ? String((o.prev_range as { end: unknown }).end)
          : "",
    },
    summary: {
      full_listens: num(s.full_listens),
      partial_listens: num(s.partial_listens),
      total_sessions: num(s.total_sessions),
      unique_listeners: num(s.unique_listeners),
      prev_full_listens: num(s.prev_full_listens),
      prev_partial_listens: num(s.prev_partial_listens),
      prev_total_sessions: num(s.prev_total_sessions),
      prev_unique_listeners: num(s.prev_unique_listeners),
    },
    daily: Array.isArray(o.daily)
      ? o.daily.map((row) => {
          const r = row as Record<string, unknown>;
          return {
            d: String(r.d ?? ""),
            full: num(r.full),
            partial: num(r.partial),
          };
        })
      : [],
    tracks: Array.isArray(o.tracks)
      ? o.tracks.map((row) => {
          const r = row as Record<string, unknown>;
          return {
            id: String(r.id ?? ""),
            title: String(r.title ?? ""),
            slug: r.slug == null ? null : String(r.slug),
            like_count: num(r.like_count),
            period_full: num(r.period_full),
            period_partial: num(r.period_partial),
            all_full: num(r.all_full),
            all_partial: num(r.all_partial),
          };
        })
      : [],
    catalog,
  };
}

export function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? null : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
