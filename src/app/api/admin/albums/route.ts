import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repos/audit";

const albumSchema = z.object({
  id: z.string().uuid().optional(),
  artistId: z.string().uuid(),
  title: z.string().min(1),
  coverUrl: z.string().optional().nullable(),
  releaseDate: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  const { supabase, user } = await requireAdminApi();
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .schema("speu")
    .from("albums")
    .select("*, artists(id, name, slug)")
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
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
