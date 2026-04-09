"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BookMarked, Globe, Music } from "lucide-react";
import { ProjectHubSectionNav } from "@/components/admin/ProjectHubSectionNav";
import { LabelSectionNav } from "@/components/admin/LabelSectionNav";
import { SiteSectionNav } from "@/components/admin/SiteSectionNav";

export function AdminSidebar() {
  const pathname = usePathname();
  const isProjectHub = pathname.startsWith("/admin/project");
  const isLabelHub = pathname.startsWith("/admin/label");
  const isSiteHub =
    pathname.startsWith("/admin/site") || pathname.startsWith("/admin/settings");

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
      active
        ? "bg-primary/10 text-primary"
        : "text-foreground/70 hover:text-foreground hover:bg-muted",
    );

  const sectionHeaderCls =
    "px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground";

  return (
    <div className="w-full md:w-64 shrink-0 md:sticky md:top-24 flex flex-col gap-3">
      {/* Лейбл */}
      <div className="glass rounded-2xl border border-border p-3">
        {isLabelHub ? (
          <>
            <p className={sectionHeaderCls}>Лейбл</p>
            <LabelSectionNav />
          </>
        ) : (
          <nav className="space-y-1">
            <Link href="/admin/label/overview" className={linkClass(false)}>
              <Music className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              Лейбл
            </Link>
          </nav>
        )}
      </div>

      {/* Сайт */}
      <div className="glass rounded-2xl border border-border p-3">
        {isSiteHub ? (
          <>
            <p className={sectionHeaderCls}>Сайт</p>
            <SiteSectionNav />
          </>
        ) : (
          <nav className="space-y-1">
            <Link href="/admin/site" className={linkClass(false)}>
              <Globe className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              Сайт
            </Link>
          </nav>
        )}
      </div>

      {/* Праект */}
      <div className="glass rounded-2xl border border-border p-3">
        {isProjectHub ? (
          <>
            <p className={sectionHeaderCls}>Праект</p>
            <ProjectHubSectionNav />
          </>
        ) : (
          <nav className="space-y-1">
            <Link href="/admin/project" className={linkClass(false)}>
              <BookMarked className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              Праект
            </Link>
          </nav>
        )}
      </div>
    </div>
  );
}
