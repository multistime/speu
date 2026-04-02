import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repos/audit";

const songSchema = z.object({
  id: z.string().uuid().optional(),
  artistId: z.string().uuid(),
  albumId: z.string().uuid().optional().nullable(),
  title: z.string().min(1),
  audioUrl: z.string().optional().nullable(),
  externalUrl: z.string().optional().nullable(),
  coverUrl: z.string().optional().nullable(),
  durationSec: z.number().int().optional().nullable(),
  trackNumber: z.number().int().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isPublished: z.boolean().default(true),
  playOnRadio: z.boolean().default(false),
});

export async function GET() {
  const { adminDb, user } = await requireAdminApi();
  if (!user || !adminDb) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // Fetch songs and related data in separate queries to avoid PostgREST schema cache issues
  const { data: songs, error: songsError } = await adminDb
    .schema("speu")
    .from("artist_tracks")
    .select("*")
    .order("sort_order", { ascending: true });

  if (songsError) {
    return NextResponse.json({ error: "fetch_failed", details: songsError.message }, { status: 500 });
  }

  // Enrich with artist names
  const artistIds = [...new Set((songs ?? []).map((s: { artist_id: string }) => s.artist_id))];
  const albumIds = [...new Set((songs ?? []).map((s: { album_id: string | null }) => s.album_id).filter(Boolean))];

  const [artistsRes, albumsRes] = await Promise.all([
    artistIds.length > 0
      ? adminDb.schema("speu").from("artists").select("id, name, slug").in("id", artistIds)
      : { data: [], error: null },
    albumIds.length > 0
      ? adminDb.schema("speu").from("albums").select("id, title").in("id", albumIds as string[])
      : { data: [], error: null },
  ]);

  const artistMap = Object.fromEntries((artistsRes.data ?? []).map((a: { id: string; name: string; slug: string }) => [a.id, a]));
  const albumMap = Object.fromEntries((albumsRes.data ?? []).map((a: { id: string; title: string }) => [a.id, a]));

  const items = (songs ?? []).map((s: Record<string, unknown>) => ({
    ...s,
    artists: artistMap[s.artist_id as string] ?? null,
    albums: s.album_id ? albumMap[s.album_id as string] ?? null : null,
  }));

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const { adminDb, user } = await requireAdminApi();
  if (!user || !adminDb) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const payload = await request.json().catch(() => null);
  const parsed = songSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });

  const row: Record<string, unknown> = {
    artist_id: parsed.data.artistId,
    album_id: parsed.data.albumId ?? null,
    title: parsed.data.title,
    audio_url: parsed.data.audioUrl ?? null,
    external_url: parsed.data.externalUrl ?? null,
    cover_url: parsed.data.coverUrl ?? null,
    duration_sec: parsed.data.durationSec ?? null,
    track_number: parsed.data.trackNumber ?? null,
    sort_order: parsed.data.sortOrder,
    is_published: parsed.data.isPublished,
  };

  // Only include play_on_radio if the column exists (safe for both DB states)
  try {
    row.play_on_radio = parsed.data.playOnRadio;
  } catch {
    // Column might not exist yet if migration hasn't been applied
  }

  if (parsed.data.id) {
    const { data, error } = await adminDb
      .schema("speu")
      .from("artist_tracks")
      .update(row)
      .eq("id", parsed.data.id)
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: "save_failed", details: error.message }, { status: 500 });
    await writeAdminAuditLog(adminDb, user.id, "song.update", "artist_tracks", data.id, { title: parsed.data.title });
    return NextResponse.json({ ok: true, id: data.id });
  }

  const { data, error } = await adminDb
    .schema("speu")
    .from("artist_tracks")
    .insert(row)
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: "save_failed", details: error.message }, { status: 500 });
  await writeAdminAuditLog(adminDb, user.id, "song.create", "artist_tracks", data.id, { title: parsed.data.title });
  return NextResponse.json({ ok: true, id: data.id });
}
