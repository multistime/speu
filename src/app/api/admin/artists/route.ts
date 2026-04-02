import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repos/audit";
import { parseArtistSocialLinksFromForm } from "@/lib/artists/social-links";
import {
  ARTIST_COLOR_PRESET_IDS,
  ARTIST_PATTERN_IDS,
  isValidHex6,
  resolveArtistVisual,
} from "@/lib/artists/visual-theme";

const colorPresetEnum = z.enum(ARTIST_COLOR_PRESET_IDS);
const patternEnum = z.enum(ARTIST_PATTERN_IDS);

const artistSchema = z
  .object({
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
    colorPreset: colorPresetEnum.default("default"),
    pattern: patternEnum.default("diamond"),
    customGradientFrom: z.string().optional(),
    customGradientTo: z.string().optional(),
    customAccent: z.string().optional(),
    instagram: z.string().optional(),
    youtube: z.string().optional(),
    spotify: z.string().optional(),
    telegram: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.colorPreset !== "custom") return;
    const checks = [
      [data.customGradientFrom?.trim() ?? "", "customGradientFrom"] as const,
      [data.customGradientTo?.trim() ?? "", "customGradientTo"] as const,
      [data.customAccent?.trim() ?? "", "customAccent"] as const,
    ];
    for (const [val, path] of checks) {
      if (!isValidHex6(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Колер у фармаце #RRGGBB",
          path: [path],
        });
      }
    }
  });

export async function GET() {
  const { adminDb, user } = await requireAdminApi();
  if (!user || !adminDb) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data, error } = await adminDb
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
  const { adminDb, user } = await requireAdminApi();
  if (!user || !adminDb) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const payload = await request.json().catch(() => null);
  const parsed = artistSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const socialParsed = parseArtistSocialLinksFromForm({
    instagram: parsed.data.instagram,
    youtube: parsed.data.youtube,
    spotify: parsed.data.spotify,
    telegram: parsed.data.telegram,
  });
  if (!socialParsed.ok) {
    return NextResponse.json(
      { error: "invalid_payload", details: socialParsed.message, field: socialParsed.field },
      { status: 400 }
    );
  }

  const visual_json = resolveArtistVisual({
    colorPreset: parsed.data.colorPreset,
    pattern: parsed.data.pattern,
    customGradientFrom: parsed.data.customGradientFrom,
    customGradientTo: parsed.data.customGradientTo,
    customAccent: parsed.data.customAccent,
  });

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
    visual_json,
    social_links: socialParsed.social_links,
    updated_by: user.id,
  };

  if (parsed.data.id) {
    const { data, error } = await adminDb
      .schema("speu")
      .from("artists")
      .update(row)
      .eq("id", parsed.data.id)
      .select("id")
      .single();
    if (error) {
      return NextResponse.json({ error: "save_failed", details: error.message }, { status: 500 });
    }
    await writeAdminAuditLog(adminDb, user.id, "artist.update", "artists", data.id, {
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

  const { data, error } = await adminDb
    .schema("speu")
    .from("artists")
    .insert(insertRow)
    .select("id")
    .single();
  if (error) {
    return NextResponse.json({ error: "save_failed", details: error.message }, { status: 500 });
  }

  await writeAdminAuditLog(adminDb, user.id, "artist.create", "artists", data.id, {
    slug: parsed.data.slug,
  });

  return NextResponse.json({ ok: true, id: data.id });
}
