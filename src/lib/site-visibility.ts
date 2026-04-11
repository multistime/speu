import { createAnonServerClient, hasSupabasePublicEnv } from "@/lib/supabase/server";
import { SITE_ROUTE_SLUGS, slugToPublicPath, SPEU_HUB_HREF } from "@/lib/site-route-slugs";

export { slugToPublicPath, pathnameToSiteRouteSlug, SITE_ROUTE_SLUGS, SPEU_HUB_HREF } from "@/lib/site-route-slugs";

function fallbackVisibleHrefs(): Set<string> {
  return new Set(["/", SPEU_HUB_HREF, ...SITE_ROUTE_SLUGS.map((s) => `/${s}`)]);
}

/** Шляхы, якія бачыць анонім/карыстальнік праз RLS (галоўная заўсёды ўключаная) */
export async function getVisiblePublicHrefs(): Promise<Set<string>> {
  if (!hasSupabasePublicEnv()) {
    return fallbackVisibleHrefs();
  }

  const supabase = createAnonServerClient();
  const { data, error } = await supabase
    .schema("speu")
    .from("content_pages")
    .select("slug")
    .eq("status", "published")
    .or("slug.eq.home,visible_on_site.eq.true");
  if (error || !data) {
    return fallbackVisibleHrefs();
  }
  const hrefs = new Set<string>([SPEU_HUB_HREF]);
  for (const row of data) {
    hrefs.add(slugToPublicPath(row.slug));
  }
  return hrefs;
}
