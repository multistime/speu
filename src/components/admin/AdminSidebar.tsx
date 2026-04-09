"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BookMarked, Music, Settings, Globe } from "lucide-react";
import { ProjectHubSectionNav } from "@/components/admin/ProjectHubSectionNav";
import { LabelSectionNav } from "@/components/admin/LabelSectionNav";
import { SiteSectionNav } from "@/components/admin/SiteSectionNav";

export function AdminSidebar() {
  const pathname = usePathname();
  const isProjectHub = pathname.startsWith("/admin/project");
  const isLabelHub = pathname.startsWith("/admin/label");
  const isSiteHub = pathname.startsWith("/admin/site");

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
      active
        ? "bg-primary/10 text-primary"
        : "text-foreground/70 hover:text-foreground hover:bg-muted",
    );

  return (
    <div className="w-full md:w-64 shrink-0 md:sticky md:top-24 flex flex-col gap-3">
      <div className="glass rounded-2xl border border-border p-3">
        <p className="px-3 py-2 text-xs uppercase tracking-[0.16em] text-muted-foreground/70">Адмінка</p>

        {isProjectHub ? (
          <nav className="space-y-1" aria-label="Хуткія спасылкі">
            <Link href="/admin/label/overview" className={linkClass(false)}>
              <Music className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              Да лэйбла
            </Link>
            <Link href="/admin/site" className={linkClass(false)}>
              <Globe className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              Сайт
            </Link>
            <Link href="/admin/settings" className={linkClass(pathname.startsWith("/admin/settings"))}>
              <Settings className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              Наладкі
            </Link>
          </nav>
        ) : (
          <div className="space-y-3">
            <div>
              {!isLabelHub ? (
                <Link href="/admin/label/overview" className={linkClass(false)}>
                  <Music className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  Лейбл
                </Link>
              ) : (
                <>
                  <p className="px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Лейбл</p>
                  <LabelSectionNav />
                </>
              )}
            </div>

            <div>
              {!isSiteHub ? (
                <Link href="/admin/site" className={linkClass(false)}>
                  <Globe className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  Сайт
                </Link>
              ) : (
                <>
                  <p className="px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Сайт</p>
                  <SiteSectionNav />
                </>
              )}
            </div>

            <nav className="space-y-1">
              <Link
                href="/admin/settings"
                className={linkClass(pathname.startsWith("/admin/settings"))}
              >
                <Settings className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                Наладкі
              </Link>
            </nav>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl border border-border p-3">
        <p className="px-3 py-2 text-xs uppercase tracking-[0.16em] text-muted-foreground/70">Праект</p>
        {isProjectHub ? (
          <>
            <p className="px-2 pt-0 pb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Змест</p>
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
