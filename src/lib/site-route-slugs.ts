/** Першы сегмент URL → slug у content_pages (публічныя старонкі) */
export const SITE_ROUTE_SLUGS = [
  "speu",
  "artists",
  "support",
  "services",
  "radio",
  "generator",
  "cabinet",
] as const;

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

export function slugToPublicPath(slug: string): string {
  if (slug === "home") return "/";
  return `/${slug}`;
}
