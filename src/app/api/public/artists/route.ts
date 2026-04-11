import { NextResponse } from "next/server";
import { topGenreCodesFromTrackLists } from "@/lib/speu/artist-genres";
import { createAnonServerClient } from "@/lib/supabase/server";

type TrackRow = {
  id: string;
  title: string;
  audio_url: string | null;
  external_url: string | null;
  sort_order: number;
  is_published: boolean;
  genres: string[] | null;
};

export async function GET() {
  const supabase = createAnonServerClient();

  const { data: artists, error: artistsError } = await supabase
    .schema("speu")
    .from("artists")
    .select(
      "id, slug, name, name_en, tagline, bio, location, year_started, initials, photo_url, social_links, visual_json"
    )
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (artistsError) return NextResponse.json({ error: "fetch_failed" }, { status: 500 });

  const artistIds = (artists ?? []).map((a: { id: string }) => a.id);
  if (artistIds.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const { data: creditRows, error: creditsError } = await supabase
    .schema("speu")
    .from("track_artists")
    .select(
      `
      artist_id,
      sort_order,
      artist_tracks (
        id,
        title,
        audio_url,
        external_url,
        sort_order,
        is_published,
        genres
      )
    `
    )
    .in("artist_id", artistIds)
    .order("sort_order", { ascending: true });

  if (creditsError) {
    return NextResponse.json({ error: "fetch_failed", details: creditsError.message }, { status: 500 });
  }

  type CreditApiRow = {
    artist_id: string;
    sort_order: number;
    artist_tracks: TrackRow | TrackRow[] | null;
  };

  const byArtist = new Map<
    string,
    Map<
      string,
      {
        title: string;
        audio_url: string | null;
        external_url: string | null;
        sort_order: number;
        genres: string[];
      }
    >
  >();

  for (const row of (creditRows ?? []) as CreditApiRow[]) {
    const tr = row.artist_tracks;
    const track = Array.isArray(tr) ? tr[0] : tr;
    if (!track?.is_published) continue;

    const inner = byArtist.get(row.artist_id) ?? new Map();
    if (inner.has(track.id)) continue;
    inner.set(track.id, {
      title: track.title,
      audio_url: track.audio_url,
      external_url: track.external_url,
      sort_order: track.sort_order,
      genres: Array.isArray(track.genres)
        ? track.genres.filter((g): g is string => typeof g === "string")
        : [],
    });
    byArtist.set(row.artist_id, inner);
  }

  const items = (artists ?? []).map((a: Record<string, unknown>) => {
    const inner = byArtist.get(a.id as string);
    const tracks = inner
      ? [...inner.values()].sort((x, y) => x.sort_order - y.sort_order || x.title.localeCompare(y.title))
      : [];
    return {
      ...a,
      genres: topGenreCodesFromTrackLists(tracks.map((t) => t.genres)),
      artist_tracks: tracks.map((t) => ({
        title: t.title,
        audio_url: t.audio_url,
        external_url: t.external_url,
        sort_order: t.sort_order,
      })),
    };
  });

  return NextResponse.json({ items });
}
