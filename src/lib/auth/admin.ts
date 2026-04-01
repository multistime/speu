import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSpeuProfile } from "@/lib/supabase/speu";

export async function requireAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const profile = await getSpeuProfile(supabase, user.id);
  if (!profile?.is_admin) {
    redirect("/");
  }

  return { supabase, user, profile };
}

export async function requireAdminApi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null };
  }

  const profile = await getSpeuProfile(supabase, user.id);
  if (!profile?.is_admin) {
    return { supabase, user: null, profile: null };
  }

  return { supabase, user, profile };
}
