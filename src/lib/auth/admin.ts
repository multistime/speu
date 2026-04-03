import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminDatabaseClient } from "@/lib/supabase/service";
import type { SpeuProfile } from "@/lib/supabase/speu";

async function fetchAdminProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<SpeuProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return null;

  const { data, error } = await supabase.rpc("get_my_speu_profile");
  if (error) {
    console.error("[requireAdmin]", error.message);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return (row ?? null) as SpeuProfile | null;
}

export async function requireAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const profile = await fetchAdminProfile(supabase, user.id);
  if (!profile?.is_admin) redirect("/");

  return { supabase, user, profile };
}

export async function requireAdminApi() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, profile: null, adminDb: null };

  const profile = await fetchAdminProfile(supabase, user.id);
  if (!profile?.is_admin) return { supabase, user: null, profile: null, adminDb: null };

  const adminDb = getAdminDatabaseClient(supabase);
  return { supabase, user, profile, adminDb };
}
