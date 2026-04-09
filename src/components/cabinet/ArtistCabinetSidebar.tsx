"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { BarChart3, Disc3, Inbox, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSpeuProfile } from "@/lib/supabase/speu";
import { linkedArtistCanEditProfile } from "@/lib/cabinet/artist-access";
import { cn } from "@/lib/utils";

function isArtistSubmissionPath(pathname: string, artistId: string): boolean {
  const prefix = `/cabinet/artist/${artistId}/submission/`;
  return pathname.startsWith(prefix);
}

export function ArtistCabinetSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const artistId = typeof params.artistId === "string" ? params.artistId : "";
  const [showProfileNav, setShowProfileNav] = useState(false);

  useEffect(() => {
    if (!artistId) {
      setShowProfileNav(false);
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const profile = await getSpeuProfile(supabase, user.id);
      if (!cancelled) {
        setShowProfileNav(linkedArtistCanEditProfile(profile, artistId));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [artistId]);

  const navItems =
    artistId.length > 0
      ? [
          { href: `/cabinet/artist/${artistId}/analytics`, label: "Аналітыка", icon: BarChart3 },
          { href: `/cabinet/artist/${artistId}/applications`, label: "Заяўкі", icon: Inbox },
          ...(showProfileNav
            ? [{ href: `/cabinet/artist/${artistId}/profile`, label: "Наладкі", icon: UserRound }]
            : []),
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
            const active = item.href.endsWith("/profile")
              ? pathname === item.href
              : item.href.endsWith("/analytics")
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
