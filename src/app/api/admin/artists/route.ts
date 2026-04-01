import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repos/audit";

const artistSchema = z.object({
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
  if (error) return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireAdminApi();
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const payload = await request.json().catch(() => null);
  const parsed = artistSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const { data, error } = await supabase
    .schema("speu")
    .from("artists")
    .upsert({
      slug: parsed.data.slug,
      name: parsed.data.name,
      name_en: parsed.data.nameEn ?? null,
      tagline: parsed.data.tagline ?? null,
      bio: parsed.data.bio ?? null,
      genres: parsed.data.genres,
      location: parsed.data.location ?? null,
      year_started: parsed.data.yearStarted ?? null,
      initials: parsed.data.initials ?? null,
      status: parsed.data.status,
      sort_order: parsed.data.sortOrder,
      updated_by: user.id,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: "save_failed" }, { status: 500 });

  await writeAdminAuditLog(supabase, user.id, "artist.upsert", "artists", data.id, {
    slug: parsed.data.slug,
  });

  return NextResponse.json({ ok: true, id: data.id });
}
