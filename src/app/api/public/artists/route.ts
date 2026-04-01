import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("speu")
    .from("artists")
    .select(`
      id, slug, name, name_en, genres, tagline, bio, location, year_started, initials,
      social_links, visual_json,
      artist_tracks (title, external_url, sort_order)
    `)
    .eq("status", "published")
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}
