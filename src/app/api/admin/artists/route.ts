import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repos/audit";

const artistSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1),
  name: z.string().min(1),
  nameEn: z.string().optional(),
  tagline: z.string().optional(),
  bio: z.string().optional(),
  genres: z.array(z.string()).default([]),
  location: z.string().optional(),
  yearStarted: z.number().int().optional(),
  initials: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  const { supabase, user } = await requireAdminApi();
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .schema("speu")
    .from("artists")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) {
    return NextResponse.json({ error: "fetch_failed", details: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireAdminApi();
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const payload = await request.json().catch(() => null);
  const parsed = artistSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const row = {
    slug: parsed.data.slug,
    name: parsed.data.name,
    name_en: parsed.data.nameEn ?? null,
    tagline: parsed.data.tagline ?? null,
    bio: parsed.data.bio ?? null,
    genres: parsed.data.genres,
    location: parsed.data.location ?? null,
    status: parsed.data.status,
    sort_order: parsed.data.sortOrder,
    updated_by: user.id,
  };

  if (parsed.data.id) {
    const { data, error } = await supabase
      .schema("speu")
      .from("artists")
      .update(row)
      .eq("id", parsed.data.id)
      .select("id")
      .single();
    if (error) {
      return NextResponse.json({ error: "save_failed", details: error.message }, { status: 500 });
    }
    await writeAdminAuditLog(supabase, user.id, "artist.update", "artists", data.id, {
      slug: parsed.data.slug,
    });
    return NextResponse.json({ ok: true, id: data.id });
  }

  const insertRow = {
    ...row,
    ...(parsed.data.yearStarted != null ? { year_started: parsed.data.yearStarted } : {}),
    ...(parsed.data.initials != null ? { initials: parsed.data.initials } : {}),
    created_by: user.id,
  };

  const { data, error } = await supabase
    .schema("speu")
    .from("artists")
    .insert(insertRow)
    .select("id")
    .single();
  if (error) {
    return NextResponse.json({ error: "save_failed", details: error.message }, { status: 500 });
  }

  await writeAdminAuditLog(supabase, user.id, "artist.create", "artists", data.id, {
    slug: parsed.data.slug,
  });

  return NextResponse.json({ ok: true, id: data.id });
}
