import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminDatabaseClient } from "@/lib/supabase/service";
import type { SpeuProfile } from "@/lib/supabase/speu";

async function fetchAdminProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<SpeuProfile | null> {
  const { data, error } = await supabase
    .schema("speu")
    .from("profiles")
    .select("id, display_name, is_admin")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("[requireAdmin]", error.message);
    return null;
  }
  return data as SpeuProfile | null;
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
