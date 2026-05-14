"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { homeSlugToPublicHref, slugToPublicPath } from "@/lib/site-route-slugs";

type ContentPageItem = {
  id: number;
  slug: string;
  title: string;
  status: string;
  visible_on_site?: boolean;
  is_home?: boolean;
};

export default function AdminContentPage() {
  const [items, setItems] = useState<ContentPageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [savingHome, setSavingHome] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/admin/content");
    if (!response.ok) {
      setError("Не ўдалося загрузіць старонкі");
      setLoading(false);
      return;
    }
    const data = await response.json();
    setItems(data.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const homeSlug = useMemo(() => items.find((p) => p.is_home)?.slug ?? "home", [items]);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.is_home) return -1;
      if (b.is_home) return 1;
      return a.title.localeCompare(b.title, "be");
    });
  }, [items]);

  const setHomePage = async (slug: string) => {
    if (slug === homeSlug) return;
    setSavingHome(true);
    setError(null);
    const res = await fetch("/api/admin/content/home", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    setSavingHome(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(typeof d.error === "string" ? d.error : "Памылка захавання галоўнай");
      return;
    }
    setItems((prev) =>
      prev.map((p) => ({
        ...p,
        is_home: p.slug === slug,
        visible_on_site: p.slug === slug ? true : p.visible_on_site,
      }))
    );
  };

  const toggleVisible = async (slug: string, next: boolean) => {
    const row = items.find((p) => p.slug === slug);
    if (row?.is_home) return;
    setSavingSlug(slug);
    setError(null);
    const res = await fetch("/api/admin/content/visibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, visibleOnSite: next }),
    });
    setSavingSlug(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(typeof d.error === "string" ? d.error : "Памылка захавання");
      return;
    }
    setItems((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, visible_on_site: next } : p))
    );
  };

  const publishedOptions = useMemo(
    () => items.filter((p) => p.status === "published").sort((a, b) => a.title.localeCompare(b.title, "be")),
    [items]
  );

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-border p-6">
        <h1 className="font-display text-2xl italic text-foreground mb-2">Кантэнт</h1>
        <p className="text-sm text-muted-foreground">
          Абярыце галоўную старонку — яна заўсёды бачная на сайце і адкрываецца на /. Іншыя старонкі можна схаваць:
          яны знікнуць з меню, URL перанакіруе на галоўную. У кабінеце адміністратар можа ўключыць паказ усіх пунктаў
          меню для перагляду схаваных.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="glass rounded-2xl border border-border p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Галоўная старонка</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Загружаецца…</p>
        ) : publishedOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Няма апублікаваных старонак</p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-muted-foreground shrink-0" htmlFor="home-page-select">
              Slug для маршруту /
            </label>
            <select
              id="home-page-select"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground min-w-[12rem]"
              value={homeSlug}
              disabled={savingHome}
              onChange={(e) => void setHomePage(e.target.value)}
            >
              {publishedOptions.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.title} ({p.slug})
                </option>
              ))}
            </select>
            {savingHome && <span className="text-xs text-muted-foreground">Захаванне…</span>}
          </div>
        )}
      </div>

      <div className="glass rounded-2xl border border-border p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Відочнасць старонак</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Загружаецца…</p>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">Няма запісаў у content_pages</p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((page) => {
              const path =
                page.slug === homeSlug
                  ? homeSlugToPublicHref(homeSlug)
                  : slugToPublicPath(page.slug, homeSlug);
              const visible = page.visible_on_site !== false;
              const locked = page.is_home === true;
              const busy = savingSlug === page.slug;
              return (
                <li
                  key={page.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{page.title}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {path}
                      {locked ? " · галоўная (заўсёды бачная)" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {visible ? "Бачная" : "Схаваная"}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={visible}
                      disabled={locked || busy}
                      onClick={() => void toggleVisible(page.slug, !visible)}
                      className={`relative w-11 h-6 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 ${
                        visible ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${
                          visible ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
