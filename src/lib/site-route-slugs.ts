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

/** `homeSlug` — slug бягучай галоўнай (калары `content_pages.is_home`). */
export function slugToPublicPath(slug: string, homeSlug: string = "home"): string {
  if (slug === homeSlug) return "/";
  return `/${slug}`;
}
