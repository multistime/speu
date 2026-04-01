"use client";

import { useEffect, useState } from "react";

type Artist = {
  id: string;
  slug: string;
  name: string;
  genres: string[];
  status: string;
};

export default function AdminArtistsPage() {
  const [items, setItems] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    name: "",
    genres: "",
    status: "draft",
  });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/artists");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    fetch("/api/admin/artists")
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        setItems(data.items ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch("/api/admin/artists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: form.slug,
        name: form.name,
        genres: form.genres.split(",").map((s) => s.trim()).filter(Boolean),
        status: form.status,
      }),
    });
    setSaving(false);
    setForm({ slug: "", name: "", genres: "", status: "draft" });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-border p-6">
        <h1 className="font-display text-2xl italic text-foreground mb-2">Артысты</h1>
        <p className="text-sm text-muted-foreground">Каталог артистов и статусы публикации.</p>
      </div>

      <div className="glass rounded-2xl border border-border p-6 space-y-3">
        <h2 className="text-sm font-semibold">Добавить/обновить артиста</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <input className="px-3 py-2 rounded-lg bg-muted border border-border text-sm" placeholder="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <input className="px-3 py-2 rounded-lg bg-muted border border-border text-sm" placeholder="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="px-3 py-2 rounded-lg bg-muted border border-border text-sm md:col-span-2" placeholder="genres через запятую" value={form.genres} onChange={(e) => setForm({ ...form, genres: e.target.value })} />
        </div>
        <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>

      <div className="glass rounded-2xl border border-border p-6">
        <h2 className="text-sm font-semibold mb-3">Список</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        ) : (
          <div className="space-y-2">
            {items.map((artist) => (
              <div key={artist.id} className="rounded-lg border border-border p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{artist.name}</p>
                  <p className="text-xs text-muted-foreground">{artist.slug}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-md bg-muted border border-border">{artist.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
