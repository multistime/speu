import { createClient } from "@/lib/supabase/server";
import { SITE_ROUTE_SLUGS, slugToPublicPath } from "@/lib/site-route-slugs";

export { slugToPublicPath, pathnameToSiteRouteSlug, SITE_ROUTE_SLUGS } from "@/lib/site-route-slugs";

/** Шляхы, якія бачыць анонім/карыстальнік праз RLS (галоўная заўсёды ўключаная) */
export async function getVisiblePublicHrefs(): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("speu")
    .from("content_pages")
    .select("slug")
    .eq("status", "published")
    .or("slug.eq.home,visible_on_site.eq.true");
  if (error || !data) {
    return new Set(SITE_ROUTE_SLUGS.map((s) => `/${s}`).concat(["/"]));
  }
  const hrefs = new Set<string>();
  for (const row of data) {
    hrefs.add(slugToPublicPath(row.slug));
  }
  return hrefs;
}
