/**
 * Першы сегмент URL → slug у content_pages (CMS).
 * «speu» тут наўмысна няма: /speu — дынамічны хаб у Next, не CMS-старонка (інакш proxy рэдырэктзіць гасцей пры адсутнасці/хаванні slug у БД).
 */
export const SITE_ROUTE_SLUGS = [
  "artists",
  "support",
  "services",
  "radio",
  "generator",
  "cabinet",
] as const;

/** Шлях публічнага струменя — заўсёды ў навігацыі, незалежна ад content_pages */
export const SPEU_HUB_HREF = "/speu" as const;

export const SPEU_SEARCH_HREF = "/speu/search" as const;

export const SPEU_LIKED_HREF = "/speu/liked" as const;

/** Slug у content_pages, які адпавядае дынамічнаму хабу Next `/speu` (не блытаць з `/`) */
export const SPEU_HUB_SLUG = "speu" as const;

/** Куды вядзе лога і што лічыць «каранём» сайта: хаб заўсёды `/speu`, іншыя галоўныя — `/` */
export function homeSlugToPublicHref(homeSlug: string): string {
  if (homeSlug === SPEU_HUB_SLUG) return SPEU_HUB_HREF;
  return slugToPublicPath(homeSlug, homeSlug);
}

export type SiteRouteSlug = (typeof SITE_ROUTE_SLUGS)[number];

export function pathnameToSiteRouteSlug(pathname: string): SiteRouteSlug | null {
  if (pathname === "/" || pathname === "") return null;
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length !== 1) return null;
  const seg = parts[0]!;
  return (SITE_ROUTE_SLUGS as readonly string[]).includes(seg)
    ? (seg as SiteRouteSlug)
    : null;
}

/** Публічны URL для slug старонкі KMS (`/speu` для хаба, інакш з улікам галоўнай) */
export function publicHrefForContentSlug(slug: string, homeSlug: string): string {
  if (slug === SPEU_HUB_SLUG) return SPEU_HUB_HREF;
  return slugToPublicPath(slug, homeSlug);
}

/** `homeSlug` — slug бягучай галоўнай (калары `content_pages.is_home`). */
export function slugToPublicPath(slug: string, homeSlug: string = "home"): string {
  if (slug === homeSlug) return "/";
  return `/${slug}`;
}
