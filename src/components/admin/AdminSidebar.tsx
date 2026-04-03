"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Music,
  Heart,
  Inbox,
  Radio,
  Settings,
  BookMarked,
} from "lucide-react";
import { ProjectHubSectionNav } from "@/components/admin/ProjectHubSectionNav";

const adminNavItems = [
  { href: "/admin", label: "Агляд", icon: LayoutDashboard, exact: true },
  { href: "/admin/content", label: "Кантэнт", icon: FileText },
  { href: "/admin/label", label: "Лэйбл", icon: Music },
  { href: "/admin/support-tiers", label: "Падтрымка", icon: Heart },
  { href: "/admin/service-requests", label: "Заяўкі", icon: Inbox },
  { href: "/admin/radio", label: "Радыё", icon: Radio },
  { href: "/admin/settings", label: "Наладкі", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const isProjectHub = pathname === "/admin/project";

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
      active
        ? "bg-primary/10 text-primary"
        : "text-foreground/70 hover:text-foreground hover:bg-muted"
    );

  return (
    <div className="w-full md:w-64 shrink-0 md:sticky md:top-24 flex flex-col gap-3">
      {/* Адмінка: на старонцы праекту — адзін пункт назад да агляду */}
      <div className="glass rounded-2xl border border-border p-3">
        <p className="px-3 py-2 text-xs uppercase tracking-[0.16em] text-muted-foreground/70">Адмінка</p>
        <nav className="space-y-1">
          {isProjectHub ? (
            <Link href="/admin" className={linkClass(false)}>
              <LayoutDashboard className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              Агляд адмінкі
            </Link>
          ) : (
            adminNavItems.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href} className={linkClass(active)}>
                  <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })
          )}
        </nav>
      </div>

      {/* Праект: згорнуты — адзін пункт; на /admin/project — змест */}
      <div className="glass rounded-2xl border border-border p-3">
        <p className="px-3 py-2 text-xs uppercase tracking-[0.16em] text-muted-foreground/70">Праект</p>
        {isProjectHub ? (
          <>
            <p className="px-2 pt-0 pb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Змест
            </p>
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
