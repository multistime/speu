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
  const { supabase, user } = await requireAdminApi();
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .schema("speu")
    .from("artist_tracks")
    .select("*, artists(id, name, slug), albums(id, title)")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: "fetch_failed", details: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireAdminApi();
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

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
    play_on_radio: parsed.data.playOnRadio,
  };

  if (parsed.data.id) {
    const { data, error } = await supabase
      .schema("speu")
      .from("artist_tracks")
      .update(row)
      .eq("id", parsed.data.id)
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: "save_failed", details: error.message }, { status: 500 });
    await writeAdminAuditLog(supabase, user.id, "song.update", "artist_tracks", data.id, { title: parsed.data.title });
    return NextResponse.json({ ok: true, id: data.id });
  }

  const { data, error } = await supabase
    .schema("speu")
    .from("artist_tracks")
    .insert(row)
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: "save_failed", details: error.message }, { status: 500 });
  await writeAdminAuditLog(supabase, user.id, "song.create", "artist_tracks", data.id, { title: parsed.data.title });
  return NextResponse.json({ ok: true, id: data.id });
}
