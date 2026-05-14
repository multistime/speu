import { createAnonServerClient, hasSupabasePublicEnv } from "@/lib/supabase/server";
import { parseFooterConfig, type FooterConfig } from "@/lib/footer-config";

export async function getFooterConfig(): Promise<FooterConfig> {
  if (!hasSupabasePublicEnv()) {
    return parseFooterConfig(null);
  }
  const supabase = createAnonServerClient();
  const { data: row } = await supabase
    .schema("speu")
    .from("site_settings")
    .select("value")
    .eq("key", "footer_config")
    .maybeSingle();
  return parseFooterConfig(row?.value ?? null);
}
