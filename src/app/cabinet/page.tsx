import { createClient } from "@/lib/supabase/server";
import type { SpeuProfile } from "@/lib/supabase/speu";
import { CabinetPageClient } from "./CabinetPageClient";
import { toCabinetUserSnapshot } from "./cabinet-user-snapshot";

export const dynamic = "force-dynamic";

export default async function CabinetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialProfile: SpeuProfile | null = null;
  if (user) {
    const { data, error } = await supabase.rpc("get_my_speu_profile");
    if (!error && data != null) {
      const row = Array.isArray(data) ? data[0] : data;
      initialProfile = row as SpeuProfile;
    }
  }

  return (
    <CabinetPageClient
      initialUser={user ? toCabinetUserSnapshot(user) : null}
      initialProfile={initialProfile}
    />
  );
}
