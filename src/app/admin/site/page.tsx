"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Music, FileText, Star, Inbox, Users, Radio } from "lucide-react";

type Stats = {
  artists_total: number;
  artists_published: number;
  tiers_active: number;
  requests_new: number;
  pages_total: number;
};

type StatsErrorPayload = { error?: string; details?: string };

export default function AdminSiteOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(async (r) => {
        const d = (await r.json()) as Stats & StatsErrorPayload;
        if (!r.ok) {
          const msg =
            typeof d.details === "string"
              ? d.details
              : typeof d.error === "string"
                ? d.error
                : `HTTP ${r.status}`;
          setLoadError(msg);
          setStats(null);
          setLoading(false);
          return;
        }
        setLoadError(null);
        setStats(d);
        setLoading(false);
      })
      .catch(() => {
        setLoadError("Сеткавая памылка");
        setLoading(false);
      });
  }, []);

  const tiles = [
    {
      href: "/admin/label/overview",
      label: "Лэйбл",
      icon: Music,
      value: loading ? "…" : String(stats?.artists_total ?? 0),
      sub: loading ? "" : `${stats?.artists_published ?? 0} артыстаў апублікавана`,
    },
    {
      href: "/admin/site/content",
      label: "Старонкі",
      icon: FileText,
      value: loading ? "…" : String(stats?.pages_total ?? 0),
      sub: "CMS-блокі кантэнту",
    },
    {
      href: "/admin/site/support-tiers",
      label: "Узроўні падтрымкі",
      icon: Star,
      value: loading ? "…" : String(stats?.tiers_active ?? 0),
      sub: "актыўных тарыфаў",
    },
    {
      href: "/admin/site/service-requests",
      label: "Заяўкі (паслугі)",
      icon: Inbox,
      value: loading ? "…" : String(stats?.requests_new ?? 0),
      sub: "новых заявак",
    },
    {
      href: "/admin/site/users",
      label: "Карыстальнікі",
      icon: Users,
      value: "→",
      sub: "улікі і ролі",
    },
    {
      href: "/admin/site/radio",
      label: "Радыё",
      icon: Radio,
      value: "→",
      sub: "налады стрыму",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-border p-8">
        <h1 className="font-display text-3xl font-semibold text-foreground mb-1 italic">
          Агляд сайту
        </h1>
        <p className="text-muted-foreground text-sm">
          Кароткія лічбы і спасылкі на кантэнт, падтрымку, заявы і налады (без каталога лэйбла).
        </p>
        {loadError ? (
          <p className="mt-4 text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
            Не ўдалося загрузіць лічбы: {loadError}
            {loadError.includes("forbidden") || loadError === "forbidden" ? (
              <span className="block mt-1 text-muted-foreground">
                Зайдзіце зноў у акаўнт або праверце, што міграцыя{" "}
                <code className="text-xs">get_my_speu_profile</code> ужытая на праекце Supabase.
              </span>
            ) : null}
          </p>
        ) : null}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
