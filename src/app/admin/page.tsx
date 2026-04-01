"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, FileText, Star, Inbox } from "lucide-react";

type Stats = {
  artists_total: number;
  artists_published: number;
  tiers_active: number;
  requests_new: number;
  pages_total: number;
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d: Stats) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const tiles = [
    {
      href: "/admin/artists",
      label: "Артысты",
      icon: Users,
      value: loading ? "…" : String(stats?.artists_total ?? 0),
      sub: loading ? "" : `${stats?.artists_published ?? 0} апублікавана`,
    },
    {
      href: "/admin/content",
      label: "Старонкі",
      icon: FileText,
      value: loading ? "…" : String(stats?.pages_total ?? 0),
      sub: "CMS-блокі кантэнту",
    },
    {
      href: "/admin/support-tiers",
      label: "Узроўні падтрымкі",
      icon: Star,
      value: loading ? "…" : String(stats?.tiers_active ?? 0),
      sub: "актыўных тарыфаў",
    },
    {
      href: "/admin/service-requests",
      label: "Заяўкі",
      icon: Inbox,
      value: loading ? "…" : String(stats?.requests_new ?? 0),
      sub: "новых заявак",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-border p-8">
        <h1 className="font-display text-3xl font-semibold text-foreground mb-1 italic">
          Адмінка SPEU
        </h1>
        <p className="text-muted-foreground text-sm">
          Панэль кіравання кантэнтам, каталогам артыстаў і заяўкамі.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="group rounded-xl border border-border p-5 bg-background/40 hover:border-primary/30 hover:bg-primary/4 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <tile.icon className="h-5 w-5 text-muted-foreground/60 group-hover:text-primary/70 transition-colors" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{tile.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{tile.label}</p>
            {tile.sub && (
              <p className="text-xs text-muted-foreground/60 mt-0.5">{tile.sub}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
