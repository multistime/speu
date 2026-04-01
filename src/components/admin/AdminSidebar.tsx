"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Users,
  Music,
  Heart,
  Inbox,
  Radio,
  Settings,
} from "lucide-react";

const items = [
  { href: "/admin",                label: "Обзор",          icon: LayoutDashboard, exact: true },
  { href: "/admin/content",        label: "Контент сайта",  icon: FileText },
  { href: "/admin/artists",        label: "Артысты",        icon: Users },
  { href: "/admin/songs",          label: "Песні",          icon: Music },
  { href: "/admin/support-tiers",  label: "Падтрымка",      icon: Heart },
  { href: "/admin/service-requests", label: "Заяўкі",       icon: Inbox },
  { href: "/admin/radio",          label: "Радыё",          icon: Radio },
  { href: "/admin/settings",       label: "Наладкі",        icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 md:shrink-0">
      <div className="glass rounded-2xl border border-border p-3 md:sticky md:top-24">
        <p className="px-3 py-2 text-xs uppercase tracking-[0.16em] text-muted-foreground/70">
          Адмінка
        </p>
        <nav className="space-y-1">
          {items.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
