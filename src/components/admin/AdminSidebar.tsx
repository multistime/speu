"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/content", label: "Контент сайта" },
  { href: "/admin/artists", label: "Артысты" },
  { href: "/admin/support-tiers", label: "Падтрымка" },
  { href: "/admin/service-requests", label: "Заяўкі" },
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
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
