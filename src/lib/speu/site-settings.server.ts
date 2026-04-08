import "server-only";

import { createClient } from "@/lib/supabase/server";

const HERO_DISC_KEY = "speu_hub_hero_disc_scale";
const MIN = 1;
const MAX = 5;

export async function fetchSpeuHubHeroDiscScale(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .schema("speu")
    .from("site_settings")
    .select("value")
    .eq("key", HERO_DISC_KEY)
    .maybeSingle();

  const n = parseInt(data?.value ?? "1", 10);
  if (Number.isNaN(n)) return MIN;
  return Math.min(MAX, Math.max(MIN, n));
}
