"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { BarChart3, Inbox, Disc3 } from "lucide-react";
import { cn } from "@/lib/utils";

function isArtistSubmissionPath(pathname: string, artistId: string): boolean {
  const prefix = `/cabinet/artist/${artistId}/submission/`;
  return pathname.startsWith(prefix);
}

export function ArtistCabinetSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const artistId = typeof params.artistId === "string" ? params.artistId : "";

  const navItems =
    artistId.length > 0
      ? [
          { href: `/cabinet/artist/${artistId}/analytics`, label: "Аналітыка", icon: BarChart3 },
          { href: `/cabinet/artist/${artistId}/applications`, label: "Заяўкі", icon: Inbox },
        ]
      : [];

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
      active
        ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
        : "text-foreground/70 hover:text-foreground hover:bg-muted",
    );

  return (
    <div className="w-full md:w-64 shrink-0 md:sticky md:top-24 flex flex-col gap-3">
      <div className="glass rounded-2xl border border-border p-3">
        <p className="px-3 py-2 text-xs uppercase tracking-[0.16em] text-muted-foreground/70 flex items-center gap-2">
          <Disc3 className="h-3.5 w-3.5 text-emerald-500/80" strokeWidth={1.75} />
          Кабінет артыста
        </p>
        <nav className="space-y-1" aria-label="Раздзелы кабінета артыста">
          {navItems.map((item) => {
            const active =
              item.href.endsWith("/analytics")
                ? pathname === item.href
                : pathname === item.href || (artistId ? isArtistSubmissionPath(pathname, artistId) : false);
            return (
              <Link key={item.href} href={item.href} className={linkClass(active)}>
                <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
