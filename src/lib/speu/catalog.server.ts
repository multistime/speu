import "server-only";

import { createAnonServerClient, createClient, hasSupabasePublicEnv } from "@/lib/supabase/server";
import { topGenreCodesFromTrackLists } from "@/lib/speu/artist-genres";
import { pickAudioUrl } from "@/lib/speu/audio";
import { DEFAULT_UI_ACCENT_PRESET_ID, resolveUiAccent } from "@/lib/speu/ui-accent";
import { themeFromVisualJson } from "@/lib/speu/theme";
import type {
  SpeuAlbumPageData,
  SpeuArtistAlbum,
  SpeuArtistPageData,
  SpeuChartMovement,
  SpeuChartRow,
  SpeuCreditArtist,
  SpeuHubArtistCard,
  SpeuPublicTrack,
  SpeuTrackPageData,
  SpeuTrackVocalLanguage,
  SpeuTrackWorkKind,
} from "@/lib/speu/types";

function publicAnonClient() {
  if (!hasSupabasePublicEnv()) return null;
  return createAnonServerClient();
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

type RawAlbum = {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  is_published: boolean;
} | null;

type RawArtistEmbed = {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  status: string;
  visual_json: Record<string, unknown> | null;
  photo_url?: string | null;
};

type RawCreditRow = {
  sort_order: number;
  artists: RawArtistEmbed | RawArtistEmbed[] | null;
};

type RawTrackRow = {
  id: string;
  slug: string;
  title: string;
  audio_url: string | null;
  external_url: string | null;
  cover_url: string | null;
  duration_sec: number | null;
  album_id: string | null;
  sort_order: number;
  play_on_radio: boolean | null;
  created_at: string;
  lyrics?: string | null;
  like_count?: number | null;
  genres?: string[] | null;
  work_kind?: string | null;
  is_explicit?: boolean | null;
  is_ai_lyrics?: boolean | null;
  is_ai_music?: boolean | null;
  lyrics_author?: string | null;
  music_author?: string | null;
  language?: string | null;
  albums: RawAlbum | RawAlbum[];
  track_artists: RawCreditRow[] | null;
};

function parseWorkKindCatalog(raw: unknown): SpeuTrackWorkKind {
  const s = typeof raw === "string" ? raw : "track";
  if (s === "beat" || s === "podcast" || s === "audiobook" || s === "track") return s;
  return "track";
}

function parseVocalLanguageCatalog(raw: unknown): SpeuTrackVocalLanguage {
  const s = typeof raw === "string" ? raw : "bel";
  if (s === "bel" || s === "ru" || s === "en" || s === "instrumental") return s;
  return "bel";
}

/** Embedded `artist_tracks` select for playable / liked lists (keep in sync with mappers). */
const SPEU_PLAYABLE_TRACK_EMBED = `
      id,
      slug,
      title,
      audio_url,
      external_url,
      cover_url,
      duration_sec,
      album_id,
      sort_order,
      play_on_radio,
      created_at,
      like_count,
      genres,
      work_kind,
      is_explicit,
      is_ai_lyrics,
      is_ai_music,
      lyrics_author,
      music_author,
      language,
      albums ( id, slug, title, cover_url, is_published ),
      track_artists (
        sort_order,
        artists ( id, slug, name, name_en, status, visual_json )
      )
    ` as const;

function normAlbum(a: RawAlbum | RawAlbum[]): RawAlbum {
  if (!a) return null;
  return Array.isArray(a) ? a[0] ?? null : a;
}

function normArtistEmbed(a: RawArtistEmbed | RawArtistEmbed[] | null): RawArtistEmbed | null {
  if (!a) return null;
  return Array.isArray(a) ? a[0] ?? null : a;
}

function mapRawTrackToPublic(row: RawTrackRow): SpeuPublicTrack | null {
  const audioUrl = pickAudioUrl(row);
  if (!audioUrl) return null;

  const credits = [...(row.track_artists ?? [])]
    .map((c) => ({ sort_order: c.sort_order, artists: normArtistEmbed(c.artists) }))
    .filter((c) => c.artists?.status === "published")
    .sort((a, b) => a.sort_order - b.sort_order);

  if (credits.length === 0) return null;

  const artists: SpeuCreditArtist[] = credits.map((c) => {
    const base = { id: c.artists!.id, slug: c.artists!.slug, name: c.artists!.name };
    const ph = c.artists?.photo_url?.trim();
    return ph ? { ...base, photoUrl: ph } : base;
  });

  const uiDefault = resolveUiAccent(DEFAULT_UI_ACCENT_PRESET_ID);

  const albumRel = normAlbum(row.albums);
  const albumOk =
    albumRel && albumRel.is_published
      ? {
          id: albumRel.id,
          slug: (albumRel.slug?.trim() || albumRel.id) as string,
          title: albumRel.title,
        }
      : null;

  const coverUrl =
    row.cover_url?.trim() || albumRel?.cover_url?.trim() || null;

  const artistLine = artists.map((x) => x.name).join(", ");

  const lc = row.like_count;
  const genres = Array.isArray(row.genres) ? row.genres.filter((g): g is string => typeof g === "string") : [];
  const base: SpeuPublicTrack = {
    id: row.id,
    slug: (row.slug?.trim() || row.id) as string,
    title: row.title,
    audioUrl,
    coverUrl,
    durationSec: row.duration_sec,
    artistLine,
    artists,
    album: albumOk,
    accentColor: uiDefault.accent,
    accentRgb: uiDefault.accentRgb,
    playOnRadio: row.play_on_radio === true,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    genres,
    workKind: parseWorkKindCatalog(row.work_kind),
    isExplicit: row.is_explicit === true,
    isAiLyrics: row.is_ai_lyrics === true,
    isAiMusic: row.is_ai_music === true,
    lyricsAuthor:
      parseVocalLanguageCatalog(row.language) === "instrumental"
        ? null
        : row.lyrics_author?.trim() || null,
    musicAuthor: row.music_author?.trim() || null,
    vocalLanguage: parseVocalLanguageCatalog(row.language),
  };
  return typeof lc === "number" && Number.isFinite(lc) ? { ...base, likeCount: lc } : base;
}

/** Fallback парадак трэкаў без метрык чарта (радыё, sort_order, дата). */
export function compareSpeuChartTiebreak(a: SpeuPublicTrack, b: SpeuPublicTrack): number {
  return chartSort(a, b);
}

function chartSort(a: SpeuPublicTrack, b: SpeuPublicTrack): number {
  const ar = a.playOnRadio ? 1 : 0;
  const br = b.playOnRadio ? 1 : 0;
  if (br !== ar) return br - ar;
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export async function fetchSpeuPlayableTracks(): Promise<SpeuPublicTrack[]> {
  const supabase = publicAnonClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .schema("speu")
    .from("artist_tracks")
    .select(SPEU_PLAYABLE_TRACK_EMBED)
    .eq("is_published", true);

  if (error) {
    console.warn("[fetchSpeuPlayableTracks]", error.message);
    return [];
  }
  if (!data) return [];

  const mapped = (data as unknown as RawTrackRow[])
    .map((r) => mapRawTrackToPublic(r))
    .filter(Boolean) as SpeuPublicTrack[];

  mapped.sort(chartSort);
  return mapped;
}

type RawTrackLikeRow = {
  created_at: string;
  artist_tracks: RawTrackRow | RawTrackRow[] | null;
};

/**
 * User's liked tracks in reverse chronological like order. Empty if not signed in.
 * @param limit — max rows; omit or `null` for no limit (subject to PostgREST defaults).
 */
export async function fetchSpeuUserLikedTracks(limit?: number | null): Promise<SpeuPublicTrack[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let q = supabase
    .schema("speu")
    .from("track_likes")
    .select(
      `
      created_at,
      artist_tracks (
        ${SPEU_PLAYABLE_TRACK_EMBED}
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (limit != null) {
    q = q.limit(limit);
  }

  const { data, error } = await q;
  if (error || !data?.length) return [];

  const out: SpeuPublicTrack[] = [];
  for (const row of data as unknown as RawTrackLikeRow[]) {
    const tr = row.artist_tracks;
    const raw = Array.isArray(tr) ? tr[0] : tr;
    if (!raw) continue;
    const pub = mapRawTrackToPublic(raw);
    if (pub) out.push(pub);
  }
  return out;
}

export async function fetchSpeuHubArtists(limit = 20): Promise<SpeuHubArtistCard[]> {
  const supabase = publicAnonClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .schema("speu")
    .from("artists")
    .select("id, slug, name, name_en, tagline, location, year_started, initials, photo_url, visual_json")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .limit(limit);

  if (error || !data) return [];

  const artistIds = data.map((a) => a.id);
  const { data: creditRows } = await supabase
    .schema("speu")
    .from("track_artists")
    .select(
      `
      artist_id,
      artist_tracks (
        id,
        genres,
        is_published
      )
    `
    )
    .in("artist_id", artistIds);

  type CreditHubRow = {
    artist_id: string;
    artist_tracks:
      | { id: string; genres: string[] | null; is_published: boolean }
      | { id: string; genres: string[] | null; is_published: boolean }[]
      | null;
  };

  const trackGenresByArtist = new Map<string, Map<string, string[]>>();
  for (const row of (creditRows ?? []) as CreditHubRow[]) {
    const tr = row.artist_tracks;
    const track = Array.isArray(tr) ? tr[0] : tr;
    if (!track?.id || !track.is_published) continue;
    const genres = Array.isArray(track.genres)
      ? track.genres.filter((g): g is string => typeof g === "string")
      : [];
    const byTrack = trackGenresByArtist.get(row.artist_id) ?? new Map();
    if (byTrack.has(track.id)) continue;
    byTrack.set(track.id, genres);
    trackGenresByArtist.set(row.artist_id, byTrack);
  }

  return data.map((a) => {
    const theme = themeFromVisualJson(a.visual_json as Record<string, unknown> | null);
    const lists = [...(trackGenresByArtist.get(a.id)?.values() ?? [])];
    return {
      slug: a.slug,
      name: a.name,
      nameEn: a.name_en ?? a.name,
      genres: topGenreCodesFromTrackLists(lists),
      tagline: a.tagline ?? "",
      location: a.location ?? "Беларусь",
      year: a.year_started ? String(a.year_started) : "—",
      initial: a.initials?.trim() || a.name.charAt(0),
      photoUrl: a.photo_url?.trim() || null,
      theme,
    };
  });
}

export async function fetchSpeuArtistBySlug(slug: string): Promise<SpeuArtistPageData | null> {
  const supabase = publicAnonClient();
  if (!supabase) return null;
  const { data: artist, error: aErr } = await supabase
    .schema("speu")
    .from("artists")
    .select(
      "id, slug, name, name_en, tagline, bio, location, year_started, initials, photo_url, social_links, visual_json"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (aErr || !artist) return null;

  const theme = themeFromVisualJson(artist.visual_json as Record<string, unknown> | null);

  const { data: albumCreditRows } = await supabase
    .schema("speu")
    .from("album_artists")
    .select("album_id")
    .eq("artist_id", artist.id);

  const creditedAlbumIds = [...new Set((albumCreditRows ?? []).map((r) => r.album_id))];

  const { data: albumRows } =
    creditedAlbumIds.length > 0
      ? await supabase
          .schema("speu")
          .from("albums")
          .select("id, slug, title, cover_url, release_date, sort_order")
          .in("id", creditedAlbumIds)
          .eq("is_published", true)
          .order("sort_order", { ascending: true })
      : { data: [] as { id: string; slug: string; title: string; cover_url: string | null; release_date: string | null; sort_order: number }[] };

  const albums: SpeuArtistAlbum[] = (albumRows ?? []).map((r) => ({
    id: r.id,
    slug: (r.slug?.trim() || r.id) as string,
    title: r.title,
    coverUrl: r.cover_url?.trim() || null,
    releaseDate: r.release_date ?? null,
  }));

  const { data: creditRows } = await supabase
    .schema("speu")
    .from("track_artists")
    .select("track_id, sort_order")
    .eq("artist_id", artist.id);

  const orderByTrack = new Map<string, number>();
  for (const c of creditRows ?? []) {
    const cur = orderByTrack.get(c.track_id);
    const next = c.sort_order ?? 0;
    if (cur === undefined || next < cur) orderByTrack.set(c.track_id, next);
  }

  const trackIds = [...orderByTrack.keys()];
  if (trackIds.length === 0) {
    return {
      slug: artist.slug,
      name: artist.name,
      nameEn: artist.name_en ?? artist.name,
      genres: [],
      tagline: artist.tagline ?? "",
      bio: artist.bio ?? "",
      location: artist.location ?? "Беларусь",
      year: artist.year_started ? String(artist.year_started) : "—",
      photoUrl: artist.photo_url?.trim() || null,
      socials: (artist.social_links ?? {}) as SpeuArtistPageData["socials"],
      theme,
      albums,
      tracks: [],
    };
  }

  const { data: trackRows } = await supabase
    .schema("speu")
    .from("artist_tracks")
    .select(
      `
      id,
      slug,
      title,
      audio_url,
      external_url,
      cover_url,
      duration_sec,
      album_id,
      sort_order,
      play_on_radio,
      created_at,
      genres,
      work_kind,
      is_explicit,
      is_ai_lyrics,
      is_ai_music,
      lyrics_author,
      music_author,
      language,
      albums ( id, slug, title, cover_url, is_published ),
      track_artists (
        sort_order,
        artists ( id, slug, name, name_en, status, visual_json )
      )
    `
    )
    .in("id", trackIds)
    .eq("is_published", true);

  const mapped = (trackRows ?? [])
    .map((r) => mapRawTrackToPublic(r as unknown as RawTrackRow))
    .filter(Boolean) as SpeuPublicTrack[];

  mapped.sort(
    (x, y) =>
      (orderByTrack.get(x.id) ?? 0) - (orderByTrack.get(y.id) ?? 0) ||
      x.sortOrder - y.sortOrder ||
      x.title.localeCompare(y.title)
  );

  return {
    slug: artist.slug,
    name: artist.name,
    nameEn: artist.name_en ?? artist.name,
    genres: topGenreCodesFromTrackLists(mapped.map((t) => t.genres)),
    tagline: artist.tagline ?? "",
    bio: artist.bio ?? "",
    location: artist.location ?? "Беларусь",
    year: artist.year_started ? String(artist.year_started) : "—",
    photoUrl: artist.photo_url?.trim() || null,
    socials: (artist.social_links ?? {}) as SpeuArtistPageData["socials"],
    theme,
    albums,
    tracks: mapped,
  };
}

export async function fetchSpeuAlbumBySlugOrId(param: string): Promise<SpeuAlbumPageData | null> {
  const supabase = publicAnonClient();
  if (!supabase) return null;

  let album: {
    id: string;
    slug: string;
    title: string;
    cover_url: string | null;
    release_date: string | null;
    description: string | null;
    artist_id: string;
    is_published: boolean;
  } | null = null;

  if (isUuid(param)) {
    const { data } = await supabase
      .schema("speu")
      .from("albums")
      .select("id, slug, title, cover_url, release_date, description, artist_id, is_published")
      .eq("id", param)
      .eq("is_published", true)
      .maybeSingle();
    album = data;
  }

  if (!album) {
    const { data } = await supabase
      .schema("speu")
      .from("albums")
      .select("id, slug, title, cover_url, release_date, description, artist_id, is_published")
      .eq("slug", param)
      .eq("is_published", true)
      .maybeSingle();
    album = data;
  }

  if (!album) return null;

  const { data: creditRows } = await supabase
    .schema("speu")
    .from("album_artists")
    .select(
      `
      sort_order,
      artists ( slug, name, status, photo_url, visual_json )
    `
    )
    .eq("album_id", album.id)
    .order("sort_order", { ascending: true });

  type CreditArtistEmb = {
    slug: string;
    name: string;
    status: string;
    photo_url: string | null;
    visual_json: unknown;
  };

  let pageArtists: SpeuAlbumPageData["artists"] = [];
  for (const r of creditRows ?? []) {
    const emb = (r as { artists?: CreditArtistEmb | CreditArtistEmb[] | null }).artists;
    const a: CreditArtistEmb | null = Array.isArray(emb) ? emb[0] ?? null : emb ?? null;
    if (!a || a.status !== "published") continue;
    pageArtists.push({
      slug: a.slug,
      name: a.name,
      photoUrl: a.photo_url?.trim() || null,
      theme: themeFromVisualJson(a.visual_json as Record<string, unknown> | null),
    });
  }

  if (pageArtists.length === 0 && album.artist_id) {
    const { data: solo } = await supabase
      .schema("speu")
      .from("artists")
      .select("slug, name, status, photo_url, visual_json")
      .eq("id", album.artist_id)
      .eq("status", "published")
      .maybeSingle();
    if (solo) {
      pageArtists = [
        {
          slug: solo.slug,
          name: solo.name,
          photoUrl: solo.photo_url?.trim() || null,
          theme: themeFromVisualJson(solo.visual_json as Record<string, unknown> | null),
        },
      ];
    }
  }

  if (pageArtists.length === 0) return null;

  const { data: trackRows } = await supabase
    .schema("speu")
    .from("artist_tracks")
    .select(
      `
      id,
      slug,
      title,
      audio_url,
      external_url,
      cover_url,
      duration_sec,
      album_id,
      sort_order,
      play_on_radio,
      created_at,
      genres,
      work_kind,
      is_explicit,
      is_ai_lyrics,
      is_ai_music,
      lyrics_author,
      music_author,
      language,
      albums ( id, slug, title, cover_url, is_published ),
      track_artists (
        sort_order,
        artists ( id, slug, name, name_en, status, visual_json )
      )
    `
    )
    .eq("album_id", album.id)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  const tracks = (trackRows ?? [])
    .map((r) => mapRawTrackToPublic(r as unknown as RawTrackRow))
    .filter(Boolean) as SpeuPublicTrack[];

  return {
    id: album.id,
    slug: (album.slug?.trim() || album.id) as string,
    title: album.title,
    coverUrl: album.cover_url?.trim() || null,
    releaseDate: album.release_date ?? null,
    description: album.description?.trim() || null,
    artists: pageArtists,
    tracks,
  };
}

/** Поўны select для старонкі трэка: тэкст, фота артыстаў */
const SPEU_TRACK_PAGE_TRACK_SELECT = `
      id,
      slug,
      title,
      audio_url,
      external_url,
      cover_url,
      duration_sec,
      album_id,
      sort_order,
      play_on_radio,
      created_at,
      lyrics,
      like_count,
      genres,
      work_kind,
      is_explicit,
      is_ai_lyrics,
      is_ai_music,
      lyrics_author,
      music_author,
      language,
      albums ( id, slug, title, cover_url, is_published ),
      track_artists (
        sort_order,
        artists ( id, slug, name, name_en, status, visual_json, photo_url )
      )
    ` as const;

export async function fetchSpeuTrackBySlugOrId(param: string): Promise<SpeuTrackPageData | null> {
  const supabase = publicAnonClient();
  if (!supabase) return null;

  let row: Record<string, unknown> | null = null;

  if (isUuid(param)) {
    const { data } = await supabase
      .schema("speu")
      .from("artist_tracks")
      .select(SPEU_TRACK_PAGE_TRACK_SELECT)
      .eq("id", param)
      .eq("is_published", true)
      .maybeSingle();
    row = data;
  }

  if (!row) {
    const { data } = await supabase
      .schema("speu")
      .from("artist_tracks")
      .select(SPEU_TRACK_PAGE_TRACK_SELECT)
      .eq("slug", param)
      .eq("is_published", true)
      .maybeSingle();
    row = data;
  }

  if (!row) return null;

  const track = mapRawTrackToPublic(row as unknown as RawTrackRow);
  if (!track) return null;

  let sameAlbum: SpeuPublicTrack[] = [];
  const albumId = typeof row.album_id === "string" ? row.album_id : null;
  if (albumId && isUuid(albumId)) {
    const { data: siblings } = await supabase
      .schema("speu")
      .from("artist_tracks")
      .select(SPEU_TRACK_PAGE_TRACK_SELECT)
      .eq("album_id", albumId)
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    sameAlbum = (siblings ?? [])
      .map((r) => mapRawTrackToPublic(r as unknown as RawTrackRow))
      .filter(Boolean) as SpeuPublicTrack[];
    sameAlbum = sameAlbum.filter((t) => t.id !== track.id);
  }

  const lyricsRaw = row.lyrics;
  const lyrics =
    typeof lyricsRaw === "string" && lyricsRaw.trim().length > 0 ? lyricsRaw.trim() : null;

  const lcRaw = row.like_count;
  const likeCount = typeof lcRaw === "number" && Number.isFinite(lcRaw) ? Math.max(0, lcRaw) : 0;

  return { track, sameAlbum, lyrics, likeCount };
}

function movementForRank(rank: number, prev: number | undefined): {
  movement: SpeuChartMovement;
  delta?: number;
} {
  if (prev == null) return { movement: "new" };
  if (prev === rank) return { movement: "same" };
  if (prev > rank) return { movement: "up", delta: prev - rank };
  return { movement: "down", delta: rank - prev };
}

/** Калі snapshot чарта не чытаецца цалком — той жа парадак, што ў радыё/каталозе. */
async function speuChartRowsFromPlayableCatalog(limit: number): Promise<{
  rows: SpeuChartRow[];
  snapshotDate: null;
  usedSnapshot: false;
}> {
  const playable = await fetchSpeuPlayableTracks();
  const rows: SpeuChartRow[] = playable.slice(0, limit).map((track, i) => ({
    track,
    rank: i + 1,
    movement: "same" as const,
    rankPrevious: null,
  }));
  return { rows, snapshotDate: null, usedSnapshot: false };
}

/**
 * Апошні апублікаваны snapshot чарта (да `limit` пазіцый) + міткі руху адносна папярэдняга snapshot.
 * Калі здымкаў няма — fallback: каталог у парадку compareSpeuChartTiebreak.
 */
export async function fetchSpeuChartRows(limit: number): Promise<{
  rows: SpeuChartRow[];
  snapshotDate: string | null;
  usedSnapshot: boolean;
}> {
  const supabase = publicAnonClient();
  if (!supabase) return speuChartRowsFromPlayableCatalog(limit);

  const { data: dates, error: dErr } = await supabase
    .schema("speu")
    .from("chart_snapshots")
    .select("snapshot_date")
    .order("snapshot_date", { ascending: false })
    .limit(2);

  if (dErr) {
    console.warn("[fetchSpeuChartRows] chart_snapshots:", dErr.message);
    return speuChartRowsFromPlayableCatalog(limit);
  }

  if (!dates?.length) {
    return speuChartRowsFromPlayableCatalog(limit);
  }

  const latest = dates[0]?.snapshot_date as string;
  const prevDate = dates[1]?.snapshot_date as string | undefined;

  const { data: snapRows, error: sErr } = await supabase
    .schema("speu")
    .from("chart_snapshots")
    .select("rank, track_id, score")
    .eq("snapshot_date", latest)
    .order("rank", { ascending: true })
    .limit(limit);

  if (sErr || !snapRows?.length) {
    return speuChartRowsFromPlayableCatalog(limit);
  }

  const prevRankByTrack = new Map<string, number>();
  if (prevDate) {
    const { data: prevRows } = await supabase
      .schema("speu")
      .from("chart_snapshots")
      .select("rank, track_id")
      .eq("snapshot_date", prevDate);

    for (const pr of prevRows ?? []) {
      prevRankByTrack.set(pr.track_id as string, pr.rank as number);
    }
  }

  const ids = snapRows.map((r) => r.track_id as string);
  const { data: tracksRaw, error: tErr } = await supabase
    .schema("speu")
    .from("artist_tracks")
    .select(SPEU_PLAYABLE_TRACK_EMBED)
    .in("id", ids)
    .eq("is_published", true);

  if (tErr || !tracksRaw?.length) {
    if (tErr) {
      console.warn("[fetchSpeuChartRows] artist_tracks by snapshot ids:", tErr.message);
    }
    return speuChartRowsFromPlayableCatalog(limit);
  }

  const byId = new Map<string, SpeuPublicTrack>();
  for (const raw of tracksRaw as unknown as RawTrackRow[]) {
    const pub = mapRawTrackToPublic(raw);
    if (pub) byId.set(pub.id, pub);
  }

  const rows: SpeuChartRow[] = [];
  for (const sr of snapRows) {
    const tid = sr.track_id as string;
    const track = byId.get(tid);
    if (!track) continue;
    const rank = sr.rank as number;
    const prevR = prevRankByTrack.get(tid);
    const { movement, delta } = movementForRank(rank, prevR);
    rows.push({
      track,
      rank,
      movement,
      rankPrevious: prevR ?? null,
      delta,
    });
  }

  if (rows.length === 0) {
    console.warn(
      "[fetchSpeuChartRows] snapshot had no playable rows after mapping; falling back to catalog",
    );
    return speuChartRowsFromPlayableCatalog(limit);
  }

  return { rows, snapshotDate: latest, usedSnapshot: true };
}
