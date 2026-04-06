import { NextResponse } from "next/server";
import { adminSongPayloadSchema } from "@/lib/admin/api-schemas";
import { requireAdminApi } from "@/lib/auth/admin";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repos/audit";
import { allocateUniqueSlug } from "@/lib/speu/slug-db.server";

export async function GET() {
  const { adminDb, user } = await requireAdminApi();
  if (!user || !adminDb) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data: songs, error: songsError } = await adminDb
    .schema("speu")
    .from("artist_tracks")
    .select("*")
    .order("sort_order", { ascending: true });

  if (songsError) {
    return NextResponse.json({ error: "fetch_failed", details: songsError.message }, { status: 500 });
  }

  const trackIds = (songs ?? []).map((s: { id: string }) => s.id);
  const { data: links } =
    trackIds.length > 0
      ? await adminDb
          .schema("speu")
          .from("track_artists")
          .select("track_id, artist_id, sort_order")
          .in("track_id", trackIds)
          .order("track_id", { ascending: true })
          .order("sort_order", { ascending: true })
      : { data: [] as { track_id: string; artist_id: string; sort_order: number }[] };

  const artistIdsOrdered = new Map<string, string[]>();
  for (const row of links ?? []) {
    const arr = artistIdsOrdered.get(row.track_id) ?? [];
    arr.push(row.artist_id);
    artistIdsOrdered.set(row.track_id, arr);
  }

  const allArtistIds = [...new Set((links ?? []).map((l) => l.artist_id))];
  const albumIds = [...new Set((songs ?? []).map((s: { album_id: string | null }) => s.album_id).filter(Boolean))];

  const [artistsRes, albumsRes] = await Promise.all([
    allArtistIds.length > 0
      ? adminDb.schema("speu").from("artists").select("id, name, slug").in("id", allArtistIds)
      : { data: [], error: null },
    albumIds.length > 0
      ? adminDb.schema("speu").from("albums").select("id, title, slug").in("id", albumIds as string[])
      : { data: [], error: null },
  ]);

  const artistMap = Object.fromEntries(
    (artistsRes.data ?? []).map((a: { id: string; name: string; slug: string }) => [a.id, a])
  );
  const albumMap = Object.fromEntries(
    (albumsRes.data ?? []).map((a: { id: string; title: string }) => [a.id, a])
  );

  const items = (songs ?? []).map((s: Record<string, unknown>) => {
    const ids = artistIdsOrdered.get(s.id as string) ?? [s.artist_id as string].filter(Boolean);
    const artistsList = ids.map((id) => artistMap[id]).filter(Boolean);
    const primaryId = (ids[0] ?? s.artist_id) as string;
    return {
      ...s,
      artist_ids: ids,
      artists_list: artistsList,
      artist_id: primaryId,
      artists: artistMap[primaryId] ?? artistsList[0] ?? null,
      albums: s.album_id ? albumMap[s.album_id as string] ?? null : null,
    };
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const { adminDb, user } = await requireAdminApi();
  if (!user || !adminDb) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const payload = await request.json().catch(() => null);
  const parsed = adminSongPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const artistIds = [...new Set(parsed.data.artistIds)];
  const { albumId } = parsed.data;
  if (artistIds.length === 0) {
    return NextResponse.json({ error: "invalid_payload", message: "Хаця б адзін унікальны артыст" }, { status: 400 });
  }
  const primaryArtistId = artistIds[0];

  if (albumId) {
    const { data: albumRow, error: albumErr } = await adminDb
      .schema("speu")
      .from("albums")
      .select("artist_id")
      .eq("id", albumId)
      .maybeSingle();
    if (albumErr || !albumRow) {
      return NextResponse.json({ error: "album_not_found" }, { status: 400 });
    }
    if (!artistIds.includes(albumRow.artist_id as string)) {
      return NextResponse.json(
        {
          error: "album_artist_mismatch",
          message: "Альбом належыць артысту, якога няма сярод выбраных на трэку",
        },
        { status: 400 }
      );
    }
  }

  const slug = await allocateUniqueSlug(
    adminDb,
    "artist_tracks",
    parsed.data.title,
    parsed.data.id,
    parsed.data.slug ?? null
  );

  const row: Record<string, unknown> = {
    artist_id: primaryArtistId,
    album_id: albumId ?? null,
    title: parsed.data.title,
    slug,
    audio_url: parsed.data.audioUrl ?? null,
    external_url: parsed.data.externalUrl ?? null,
    cover_url: parsed.data.coverUrl ?? null,
    duration_sec: parsed.data.durationSec ?? null,
    track_number: parsed.data.trackNumber ?? null,
    sort_order: parsed.data.sortOrder,
    is_published: parsed.data.isPublished,
    play_on_radio: parsed.data.playOnRadio,
  };

  let trackId: string;

  if (parsed.data.id) {
    trackId = parsed.data.id;
    const { error } = await adminDb.schema("speu").from("artist_tracks").update(row).eq("id", trackId);
    if (error) return NextResponse.json({ error: "save_failed", details: error.message }, { status: 500 });

    const { error: delLinks } = await adminDb.schema("speu").from("track_artists").delete().eq("track_id", trackId);
    if (delLinks) return NextResponse.json({ error: "save_failed", details: delLinks.message }, { status: 500 });

    await writeAdminAuditLog(adminDb, user.id, "song.update", "artist_tracks", trackId, {
      title: parsed.data.title,
      artistIds: [...artistIds],
    });
  } else {
    const { data, error } = await adminDb
      .schema("speu")
      .from("artist_tracks")
      .insert(row)
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: "save_failed", details: error.message }, { status: 500 });
    trackId = data.id;
    await writeAdminAuditLog(adminDb, user.id, "song.create", "artist_tracks", trackId, {
      title: parsed.data.title,
      artistIds: [...artistIds],
    });
  }

  const linkRows = artistIds.map((artistId, index) => ({
    track_id: trackId,
    artist_id: artistId,
    sort_order: index,
  }));

  const { error: linkIns } = await adminDb.schema("speu").from("track_artists").insert(linkRows);
  if (linkIns) return NextResponse.json({ error: "save_failed", details: linkIns.message }, { status: 500 });

  return NextResponse.json({ ok: true, id: trackId });
}
