import type { SupabaseClient } from "@supabase/supabase-js";

export async function listServiceRequests(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .schema("speu")
    .from("service_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
