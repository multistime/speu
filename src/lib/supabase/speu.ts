import type { SupabaseClient } from "@supabase/supabase-js";

export type SpeuProfile = {
  id: string;
  display_name: string | null;
  is_admin: boolean;
};

export async function getSpeuProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<SpeuProfile | null> {
  const { data, error } = await supabase
    .schema("speu")
    .from("profiles")
    .select("id, display_name, is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
