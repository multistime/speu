"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Heart, Inbox, LayoutDashboard, Radio, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE_NAV_SECTIONS, siteNavPath, type SiteNavSectionKey } from "@/lib/admin/site-nav-data";

const ICONS: Record<SiteNavSectionKey, typeof LayoutDashboard> = {
  overview: LayoutDashboard,
  content: FileText,
  supportTiers: Heart,
  serviceRequests: Inbox,
  users: Users,
  radio: Radio,
};

export function SiteSectionNav() {
  const pathname = usePathname();
  const base = "/admin/site";

  if (!pathname.startsWith(base)) return null;

  return (
    <nav className="space-y-0.5" aria-label="Раздзелы сайту">
      {SITE_NAV_SECTIONS.map(({ key, label, pathSuffix, blurb }) => {
        const href = siteNavPath(key);
        const active =
          key === "overview"
            ? pathname === base || pathname === `${base}/`
            : pathname === href || pathname.startsWith(`${href}/`);
        const Icon = ICONS[key];
        return (
          <Link
            key={key}
            href={href}
            className={cn(
              "w-full text-left rounded-xl px-2.5 py-2 transition-colors flex gap-2.5 items-start",
              active ? "bg-primary/12 text-primary" : "text-foreground/75 hover:bg-muted",
            )}
          >
            <Icon className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
            <span className="min-w-0">
              <span className="block text-sm font-medium leading-tight">{label}</span>
              <span className="block text-[11px] text-muted-foreground mt-0.5 leading-snug">{blurb}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
