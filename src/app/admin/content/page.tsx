"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { slugToPublicPath } from "@/lib/site-route-slugs";

type ContentPageItem = {
  id: number;
  slug: string;
  title: string;
  status: string;
  visible_on_site?: boolean;
};

export default function AdminContentPage() {
  const [items, setItems] = useState<ContentPageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
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

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.slug === "home") return -1;
      if (b.slug === "home") return 1;
      return a.title.localeCompare(b.title, "be");
    });
  }, [items]);

  const toggleVisible = async (slug: string, next: boolean) => {
    if (slug === "home") return;
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

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-border p-6">
        <h1 className="font-display text-2xl italic text-foreground mb-2">Кантэнт</h1>
        <p className="text-sm text-muted-foreground">
          Уключайце або хавайце старонкі для публікі. Схаваная старонка не паказваецца ў меню і пры адкрыцці URL робіць
          рэдырэкт на галоўную. Галоўная заўсёды бачная.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="glass rounded-2xl border border-border p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Старонкі</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Загружаецца…</p>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">Няма запісаў у content_pages</p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((page) => {
              const path = slugToPublicPath(page.slug);
              const visible = page.visible_on_site !== false;
              const locked = page.slug === "home";
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
                      {locked ? " · заўсёды бачная" : ""}
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
