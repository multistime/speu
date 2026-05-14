import { createAnonServerClient, hasSupabasePublicEnv } from "@/lib/supabase/server";

const FALLBACK_HOME_SLUG = "home";

/** Slug CMS-старонкі, якая адлюстроўваецца на `/` */
export async function getHomePageSlug(): Promise<string> {
  if (!hasSupabasePublicEnv()) {
    return FALLBACK_HOME_SLUG;
  }
  const supabase = createAnonServerClient();
  const { data, error } = await supabase
    .schema("speu")
    .from("content_pages")
    .select("slug")
    .eq("is_home", true)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data?.slug) {
    return FALLBACK_HOME_SLUG;
  }
  return data.slug;
}
