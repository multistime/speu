"use client";

import { useEffect, useState } from "react";
import { Trash2, Pencil, X } from "lucide-react";

type Artist = {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  tagline: string | null;
  bio: string | null;
  genres: string[];
  location: string | null;
  status: string;
  sort_order: number;
};

const emptyForm = {
  id: "",
  slug: "",
  name: "",
  nameEn: "",
  tagline: "",
  bio: "",
  genres: "",
  location: "",
  status: "draft",
  sortOrder: "0",
};

export default function AdminArtistsPage() {
  const [items, setItems] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/artists");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const editArtist = (artist: Artist) => {
    setForm({
      id: artist.id,
      slug: artist.slug,
      name: artist.name,
      nameEn: artist.name_en ?? "",
      tagline: artist.tagline ?? "",
      bio: artist.bio ?? "",
      genres: (artist.genres ?? []).join(", "),
      location: artist.location ?? "",
      status: artist.status,
      sortOrder: String(artist.sort_order),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    if (!form.slug || !form.name) {
      setError("Патрабуецца slug і назва");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/artists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: form.slug,
        name: form.name,
        nameEn: form.nameEn || undefined,
        tagline: form.tagline || undefined,
        bio: form.bio || undefined,
        genres: form.genres.split(",").map((s) => s.trim()).filter(Boolean),
        location: form.location || undefined,
        status: form.status,
        sortOrder: Number(form.sortOrder),
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Памылка захавання");
    } else {
      setForm(emptyForm);
      await load();
    }
    setSaving(false);
  };

  const deleteArtist = async (id: string) => {
    if (!confirm("Выдаліць артыста? Усе яго песні і альбомы будуць выдалены.")) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/artists/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Памылка выдалення");
    } else {
      await load();
    }
    setDeleting(null);
  };

  const inputCls = "px-3 py-2 rounded-lg bg-muted border border-border text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary";
  const labelCls = "text-xs text-muted-foreground mb-1 block";

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-border p-6">
        <h1 className="font-display text-2xl italic text-foreground mb-2">Артысты</h1>
        <p className="text-sm text-muted-foreground">Каталог артыстаў і статусы публікацыі.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Form */}
      <div className="glass rounded-2xl border border-border p-6 space-y-4">
        <h2 className="text-sm font-semibold">
          {form.id ? "Рэдагаваць артыста" : "Дадаць артыста"}
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Slug (URL) *</label>
            <input
              className={inputCls}
              placeholder="artist-slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Назва *</label>
            <input
              className={inputCls}
              placeholder="Назва артыста"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Назва па-ангельску</label>
            <input
              className={inputCls}
              placeholder="Artist Name"
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Лакацыя</label>
            <input
              className={inputCls}
              placeholder="Мінск, Беларусь"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Слоган</label>
            <input
              className={inputCls}
              placeholder="Кароткі апісальны слоган"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Жанры (праз коску)</label>
            <input
              className={inputCls}
              placeholder="folk, electronic, pop"
              value={form.genres}
              onChange={(e) => setForm({ ...form, genres: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Біяграфія</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Біяграфія артыста..."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Статус</label>
            <select
              className={inputCls}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="draft">Чарнавік</option>
              <option value="published">Апублікаваны</option>
              <option value="archived">Архіў</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Парадак сартавання</label>
            <input
              className={inputCls}
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
          >
            {saving ? "Захаванне..." : form.id ? "Абнавіць" : "Дадаць"}
          </button>
          {form.id && (
            <button
              onClick={() => { setForm(emptyForm); setError(null); }}
              className="px-4 py-2 rounded-lg border border-border text-sm text-foreground/70 hover:text-foreground"
            >
              Скасаваць
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="glass rounded-2xl border border-border p-6">
        <h2 className="text-sm font-semibold mb-4">Спіс ({items.length})</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Артысты не знойдзены</p>
        ) : (
          <div className="space-y-2">
            {items.map((artist) => (
              <div key={artist.id} className="rounded-lg border border-border p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{artist.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {artist.slug}
                    {artist.genres?.length ? ` · ${artist.genres.join(", ")}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-1 rounded border ${
                    artist.status === "published"
                      ? "border-green-500/30 text-green-600 bg-green-500/10"
                      : artist.status === "archived"
                      ? "border-border text-muted-foreground/60 bg-muted"
                      : "border-border text-muted-foreground bg-muted"
                  }`}>
                    {artist.status}
                  </span>
                  <button
                    onClick={() => editArtist(artist)}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Рэдагаваць"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteArtist(artist.id)}
                    disabled={deleting === artist.id}
                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                    title="Выдаліць"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
