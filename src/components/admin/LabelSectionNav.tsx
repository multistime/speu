"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Disc, Inbox, Music, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { LABEL_NAV_SECTIONS, labelNavPath, type LabelNavSectionKey } from "@/lib/admin/label-nav-data";

const ICONS: Record<LabelNavSectionKey, typeof Music> = {
  overview: BarChart3,
  distribution: Inbox,
  songs: Music,
  albums: Disc,
  artists: Users,
};

export function LabelSectionNav() {
  const pathname = usePathname();

  if (!pathname.startsWith("/admin/label")) return null;

  return (
    <nav className="space-y-0.5" aria-label="Раздзелы лэйбла">
      {LABEL_NAV_SECTIONS.map(({ key, label, blurb }) => {
        const href = labelNavPath(key);
        const active = pathname === href || pathname.startsWith(`${href}/`);
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
