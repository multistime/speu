import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repos/audit";

const emptyToNull = (v: unknown) => {
  if (v == null) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  return v;
};

const albumSchema = z.object({
  id: z.string().uuid().optional(),
  artistId: z.string().uuid(),
  title: z.string().min(1),
  coverUrl: z.preprocess(emptyToNull, z.string().nullable().optional()),
  releaseDate: z.preprocess((v) => {
    const n = emptyToNull(v);
    if (n == null) return null;
    if (typeof n !== "string") return null;
    const s = n.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    return s;
  }, z.string().nullable().optional()),
  description: z.preprocess(emptyToNull, z.string().nullable().optional()),
  isPublished: z.boolean().default(false),
  sortOrder: z.preprocess((v) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  }, z.number().int()),
});

export async function GET() {
  const { supabase, user } = await requireAdminApi();
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // Fetch albums and artists separately to avoid PostgREST schema cache dependency
  const { data: albums, error: albumsError } = await supabase
    .schema("speu")
    .from("albums")
    .select("*")
    .order("sort_order", { ascending: true });

  if (albumsError) {
    return NextResponse.json({ error: "fetch_failed", details: albumsError.message }, { status: 500 });
  }

  const artistIds = [...new Set((albums ?? []).map((a: { artist_id: string }) => a.artist_id))];
  const { data: artists, error: artistsError } = artistIds.length > 0
    ? await supabase.schema("speu").from("artists").select("id, name, slug").in("id", artistIds)
    : { data: [], error: null };

  if (artistsError) {
    return NextResponse.json(
      { error: "fetch_failed", details: artistsError.message },
      { status: 500 }
    );
  }

  const artistMap = Object.fromEntries((artists ?? []).map((a: { id: string; name: string; slug: string }) => [a.id, a]));

  const items = (albums ?? []).map((album: Record<string, unknown>) => ({
    ...album,
    artists: artistMap[album.artist_id as string] ?? null,
  }));

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireAdminApi();
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const payload = await request.json().catch(() => null);
  const parsed = albumSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });

  const row: Record<string, unknown> = {
    artist_id: parsed.data.artistId,
    title: parsed.data.title,
    cover_url: parsed.data.coverUrl ?? null,
    release_date: parsed.data.releaseDate ?? null,
    description: parsed.data.description ?? null,
    is_published: parsed.data.isPublished,
    sort_order: parsed.data.sortOrder,
    updated_by: user.id,
  };

  if (parsed.data.id) {
    const { data, error } = await supabase
      .schema("speu")
      .from("albums")
      .update(row)
      .eq("id", parsed.data.id)
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: "save_failed", details: error.message }, { status: 500 });
    await writeAdminAuditLog(supabase, user.id, "album.update", "albums", data.id, { title: parsed.data.title });
    return NextResponse.json({ ok: true, id: data.id });
  }

  row.created_by = user.id;
  const { data, error } = await supabase
    .schema("speu")
    .from("albums")
    .insert(row)
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: "save_failed", details: error.message }, { status: 500 });
  await writeAdminAuditLog(supabase, user.id, "album.create", "albums", data.id, { title: parsed.data.title });
  return NextResponse.json({ ok: true, id: data.id });
}
