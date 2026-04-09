import type { SupabaseClient } from "@supabase/supabase-js";

export type ArtistRecord = {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  tagline: string | null;
  bio: string | null;
  location: string | null;
  year_started: number | null;
  initials: string | null;
  social_links: Record<string, string>;
  visual_json: Record<string, unknown>;
  status: "draft" | "published" | "archived";
  sort_order: number;
};

export async function listArtists(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .schema("speu")
    .from("artists")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ArtistRecord[];
}
