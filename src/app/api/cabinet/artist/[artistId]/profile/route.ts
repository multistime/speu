import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildCabinetArtistProfileUpdateRow,
  cabinetArtistProfilePatchSchema,
} from "@/lib/cabinet/artist-profile-payload";
import {
  detectColorPreset,
  parsePatternFromVisual,
  type ArtistColorPresetId,
  type ArtistPatternId,
} from "@/lib/artists/visual-theme";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function mapArtistRowToPayload(row: {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  tagline: string | null;
  bio: string | null;
  location: string | null;
  year_started: number | null;
  initials: string | null;
  social_links: Record<string, string> | null;
  visual_json: Record<string, unknown> | null;
  photo_url: string | null;
  linked_user_can_edit_profile: boolean | null;
}) {
  const vj = (row.visual_json ?? {}) as Record<string, unknown>;
  const preset = detectColorPreset(vj);
  const sl = row.social_links ?? {};
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameEn: row.name_en ?? "",
    tagline: row.tagline ?? "",
    bio: row.bio ?? "",
    location: row.location ?? "",
    yearStarted: row.year_started,
    initials: row.initials ?? "",
    colorPreset: preset as ArtistColorPresetId | "custom",
    pattern: parsePatternFromVisual(vj.pattern) as ArtistPatternId,
    customGradientFrom: String(vj.gradientFrom ?? "#2B5035"),
    customGradientTo: String(vj.gradientTo ?? "#0E1811"),
    customAccent: String(vj.accent ?? "#7DBF9E"),
    instagram: sl.instagram ?? "",
    youtube: sl.youtube ?? "",
    spotify: sl.spotify ?? "",
    telegram: sl.telegram ?? "",
    photoUrl: row.photo_url?.trim() ?? "",
    canEditProfile: row.linked_user_can_edit_profile !== false,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ artistId: string }> }
) {
  const { artistId } = await params;
  if (!z.string().uuid().safeParse(artistId).success) {
    return NextResponse.json({ error: "invalid_artist_id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: row, error } = await supabase
    .schema("speu")
    .from("artists")
    .select(
      "id, slug, name, name_en, tagline, bio, location, year_started, initials, social_links, visual_json, photo_url, user_id, linked_user_can_edit_profile"
    )
    .eq("id", artistId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "fetch_failed", details: error.message }, { status: 500 });
  }
  if (!row || row.user_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (row.linked_user_can_edit_profile === false) {
    return NextResponse.json({ error: "edit_disabled", message: "Рэдагаванне картачкі адключана лэйблам." }, { status: 403 });
  }

  return NextResponse.json(mapArtistRowToPayload(row));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ artistId: string }> }
) {
  const { artistId } = await params;
  if (!z.string().uuid().safeParse(artistId).success) {
    return NextResponse.json({ error: "invalid_artist_id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: gate, error: gateErr } = await supabase
    .schema("speu")
    .from("artists")
    .select("user_id, linked_user_can_edit_profile")
    .eq("id", artistId)
    .maybeSingle();

  if (gateErr) {
    return NextResponse.json({ error: "fetch_failed", details: gateErr.message }, { status: 500 });
  }
  if (!gate || gate.user_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (gate.linked_user_can_edit_profile === false) {
    return NextResponse.json({ error: "edit_disabled" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = cabinetArtistProfilePatchSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const built = buildCabinetArtistProfileUpdateRow(parsed.data, user.id);
  if (!built.ok) {
    return NextResponse.json(
      { error: "invalid_payload", details: built.message, field: built.field },
      { status: 400 }
    );
  }

  const { error: upErr } = await supabase
    .schema("speu")
    .from("artists")
    .update(built.row)
    .eq("id", artistId);

  if (upErr) {
    const msg = upErr.message.toLowerCase();
    if (msg.includes("linked_artist_cannot_change_structural_fields")) {
      return NextResponse.json({ error: "forbidden", details: "Нельга змяняць службовыя палі." }, { status: 403 });
    }
    return NextResponse.json({ error: "save_failed", details: upErr.message }, { status: 500 });
  }

  const { data: row, error: readErr } = await supabase
    .schema("speu")
    .from("artists")
    .select(
      "id, slug, name, name_en, tagline, bio, location, year_started, initials, social_links, visual_json, photo_url, linked_user_can_edit_profile"
    )
    .eq("id", artistId)
    .maybeSingle();

  if (readErr || !row) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(mapArtistRowToPayload(row));
}
