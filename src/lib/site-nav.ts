import type { SupabaseClient } from "@supabase/supabase-js";
import { createAnonServerClient, hasSupabasePublicEnv } from "@/lib/supabase/server";
import {
  homeSlugToPublicHref,
  publicHrefForContentSlug,
  SPEU_HUB_HREF,
} from "@/lib/site-route-slugs";

export type SiteNavItem = {
  slug: string;
  title: string;
  href: string;
};

const FALLBACK_NAV: SiteNavItem[] = [
  { slug: "speu", title: "Спеў", href: SPEU_HUB_HREF },
  { slug: "generator", title: "Генератар", href: "/generator" },
  { slug: "artists", title: "Артысты", href: "/artists" },
  { slug: "radio", title: "Радыё Мара", href: "/radio" },
  { slug: "services", title: "Паслугі", href: "/services" },
  { slug: "support", title: "Падтрымка", href: "/support" },
];

function mapPublishedRows(
  rows: { slug: string; title: string; is_home: boolean | null }[],
  homeSlug: string
): { logoHref: string; items: SiteNavItem[] } {
  const logoHref = homeSlugToPublicHref(homeSlug);
  const items: SiteNavItem[] = rows
    .filter((r) => !r.is_home)
    .map((r) => ({
      slug: r.slug,
      title: r.title,
      href: publicHrefForContentSlug(r.slug, homeSlug),
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "be"));
  return { logoHref, items };
}

function pickHomeSlug(rows: { slug: string; is_home: boolean | null }[]): string {
  for (const row of rows) {
    if (row.is_home) return row.slug;
  }
  return "home";
}

/** Меню для гасцёў: апублікаваныя і (бачныя на сайце або галоўная) — як у RLS */
export async function getPublicSiteNav(): Promise<{
  logoHref: string;
  items: SiteNavItem[];
}> {
  if (!hasSupabasePublicEnv()) {
    return {
      logoHref: "/",
      items: FALLBACK_NAV,
    };
  }

  const supabase = createAnonServerClient();
  const { data, error } = await supabase
    .schema("speu")
    .from("content_pages")
    .select("slug, title, is_home")
    .eq("status", "published")
    .or("is_home.eq.true,visible_on_site.eq.true");

  if (error || !data?.length) {
    return {
      logoHref: "/",
      items: FALLBACK_NAV,
    };
  }

  const homeSlug = pickHomeSlug(data);
  return mapPublishedRows(data, homeSlug);
}

/** Усе апублікаваныя старонкі ў меню (мінус галоўная); для адміна з «паказаць усе» */
export async function getExpandedSiteNav(supabase: SupabaseClient): Promise<{
  logoHref: string;
  items: SiteNavItem[];
}> {
  const { data, error } = await supabase
    .schema("speu")
    .from("content_pages")
    .select("slug, title, is_home")
    .eq("status", "published");

  if (error || !data?.length) {
    return getPublicSiteNav();
  }

  const homeSlug = pickHomeSlug(data);
  return mapPublishedRows(data, homeSlug);
}
