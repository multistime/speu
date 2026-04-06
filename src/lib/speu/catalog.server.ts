import "server-only";

import { createClient } from "@/lib/supabase/server";
import { pickAudioUrl } from "@/lib/speu/audio";
import { themeFromVisualJson } from "@/lib/speu/theme";
import type {
  SpeuAlbumPageData,
  SpeuArtistAlbum,
  SpeuArtistPageData,
  SpeuCreditArtist,
  SpeuHubArtistCard,
  SpeuPublicTrack,
  SpeuTrackPageData,
} from "@/lib/speu/types";

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
  albums: RawAlbum | RawAlbum[];
  track_artists: RawCreditRow[] | null;
};

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

  const artists: SpeuCreditArtist[] = credits.map((c) => ({
    id: c.artists!.id,
    slug: c.artists!.slug,
    name: c.artists!.name,
  }));

  const primaryVisual = credits[0]?.artists?.visual_json;
  const th = themeFromVisualJson(primaryVisual ?? undefined);

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

  return {
    id: row.id,
    slug: (row.slug?.trim() || row.id) as string,
    title: row.title,
    audioUrl,
    coverUrl,
    durationSec: row.duration_sec,
    artistLine,
    artists,
    album: albumOk,
    accentColor: th.accent,
    accentRgb: th.accentRgb,
    playOnRadio: row.play_on_radio === true,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function chartSort(a: SpeuPublicTrack, b: SpeuPublicTrack): number {
  const ar = a.playOnRadio ? 1 : 0;
  const br = b.playOnRadio ? 1 : 0;
  if (br !== ar) return br - ar;
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export async function fetchSpeuPlayableTracks(): Promise<SpeuPublicTrack[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
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
      albums ( id, slug, title, cover_url, is_published ),
      track_artists (
        sort_order,
        artists ( id, slug, name, name_en, status, visual_json )
      )
    `
    )
    .eq("is_published", true);

  if (error || !data) return [];

  const mapped = (data as unknown as RawTrackRow[])
    .map((r) => mapRawTrackToPublic(r))
    .filter(Boolean) as SpeuPublicTrack[];

  mapped.sort(chartSort);
  return mapped;
}

export async function fetchSpeuHubArtists(limit = 20): Promise<SpeuHubArtistCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("speu")
    .from("artists")
    .select("slug, name, name_en, genres, tagline, location, year_started, initials, photo_url, visual_json")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .limit(limit);

  if (error || !data) return [];

  return data.map((a) => {
    const theme = themeFromVisualJson(a.visual_json as Record<string, unknown> | null);
    return {
      slug: a.slug,
      name: a.name,
      nameEn: a.name_en ?? a.name,
      genres: a.genres ?? [],
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
  const supabase = await createClient();
  const { data: artist, error: aErr } = await supabase
    .schema("speu")
    .from("artists")
    .select(
      "id, slug, name, name_en, genres, tagline, bio, location, year_started, initials, photo_url, social_links, visual_json"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (aErr || !artist) return null;

  const theme = themeFromVisualJson(artist.visual_json as Record<string, unknown> | null);

  const { data: albumRows } = await supabase
    .schema("speu")
    .from("albums")
    .select("id, slug, title, cover_url, release_date")
    .eq("artist_id", artist.id)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

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
      genres: artist.genres ?? [],
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
    genres: artist.genres ?? [],
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
  const supabase = await createClient();

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

  const { data: artist } = await supabase
    .schema("speu")
    .from("artists")
    .select("slug, name, status, visual_json")
    .eq("id", album.artist_id)
    .eq("status", "published")
    .maybeSingle();

  if (!artist) return null;

  const artistTheme = themeFromVisualJson(artist.visual_json as Record<string, unknown> | null);

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
    artist: { slug: artist.slug, name: artist.name, theme: artistTheme },
    tracks,
  };
}

export async function fetchSpeuTrackBySlugOrId(param: string): Promise<SpeuTrackPageData | null> {
  const supabase = await createClient();

  const selectTracks = `
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
      albums ( id, slug, title, cover_url, is_published ),
      track_artists (
        sort_order,
        artists ( id, slug, name, name_en, status, visual_json )
      )
    `;

  let row: Record<string, unknown> | null = null;

  if (isUuid(param)) {
    const { data } = await supabase
      .schema("speu")
      .from("artist_tracks")
      .select(selectTracks)
      .eq("id", param)
      .eq("is_published", true)
      .maybeSingle();
    row = data;
  }

  if (!row) {
    const { data } = await supabase
      .schema("speu")
      .from("artist_tracks")
      .select(selectTracks)
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
        albums ( id, slug, title, cover_url, is_published ),
        track_artists (
          sort_order,
          artists ( id, slug, name, name_en, status, visual_json )
        )
      `
      )
      .eq("album_id", albumId)
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    sameAlbum = (siblings ?? [])
      .map((r) => mapRawTrackToPublic(r as unknown as RawTrackRow))
      .filter(Boolean) as SpeuPublicTrack[];
    sameAlbum = sameAlbum.filter((t) => t.id !== track.id);
  }

  return { track, sameAlbum };
}
