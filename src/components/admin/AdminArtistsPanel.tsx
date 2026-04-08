"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2, Pencil, Plus, X } from "lucide-react";
import { AdminFormModal } from "@/components/admin/AdminFormModal";
import { AdminImageSourceField } from "@/components/admin/AdminImageSourceField";
import { ArtistPattern } from "@/components/artists/artist-pattern";
import {
  ARTIST_COLOR_PRESETS,
  ARTIST_PATTERN_IDS,
  ARTIST_PATTERN_LABELS,
  detectColorPreset,
  parsePatternFromVisual,
  resolveArtistVisual,
  type ArtistColorPresetId,
  type ArtistPatternId,
} from "@/lib/artists/visual-theme";

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
  social_links?: Record<string, string> | null;
  visual_json?: Record<string, unknown> | null;
  photo_url?: string | null;
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
  colorPreset: "default" as ArtistColorPresetId,
  pattern: "diamond" as ArtistPatternId,
  customGradientFrom: "#2B5035",
  customGradientTo: "#0E1811",
  customAccent: "#7DBF9E",
  instagram: "",
  youtube: "",
  spotify: "",
  telegram: "",
  photoUrl: "",
};

type CatalogVisibilityFilter = "all" | "published" | "unpublished";

type AdminArtistsPanelProps = {
  onCatalogChanged?: () => void;
  listSearch?: string;
  visibilityFilter?: CatalogVisibilityFilter;
};

export function AdminArtistsPanel({
  onCatalogChanged,
  listSearch = "",
  visibilityFilter = "unpublished",
}: AdminArtistsPanelProps) {
  const [items, setItems] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/artists");
    const data = (await res.json().catch(() => ({}))) as {
      items?: Artist[];
      error?: string;
      details?: string;
    };
    if (!res.ok) {
      setError(
        typeof data.details === "string"
          ? data.details
          : typeof data.error === "string"
            ? data.error
            : `Памылка загрузкі (${res.status})`,
      );
      setItems([]);
    } else {
      setItems(data.items ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const visibleItems = useMemo(() => {
    let list = items;
    if (visibilityFilter === "published") {
      list = list.filter((a) => a.status === "published");
    } else if (visibilityFilter === "unpublished") {
      list = list.filter((a) => a.status !== "published");
    }
    const q = listSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((a) => {
        const hay = [
          a.name,
          a.slug,
          a.name_en ?? "",
          ...(a.genres ?? []),
          a.tagline ?? "",
          a.location ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [items, listSearch, visibilityFilter]);

  const editArtist = (artist: Artist) => {
    const vj = (artist.visual_json ?? {}) as Record<string, unknown>;
    const preset = detectColorPreset(vj);
    const sl = artist.social_links ?? {};
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
      colorPreset: preset,
      pattern: parsePatternFromVisual(vj.pattern),
      customGradientFrom: String(vj.gradientFrom ?? "#2B5035"),
      customGradientTo: String(vj.gradientTo ?? "#0E1811"),
      customAccent: String(vj.accent ?? "#7DBF9E"),
      instagram: sl.instagram ?? "",
      youtube: sl.youtube ?? "",
      spotify: sl.spotify ?? "",
      telegram: sl.telegram ?? "",
      photoUrl: artist.photo_url ?? "",
    });
    setFormOpen(true);
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
        ...(form.id ? { id: form.id } : {}),
        slug: form.slug,
        name: form.name,
        nameEn: form.nameEn || undefined,
        tagline: form.tagline || undefined,
        bio: form.bio || undefined,
        genres: form.genres.split(",").map((s) => s.trim()).filter(Boolean),
        location: form.location || undefined,
        status: form.status,
        sortOrder: Number(form.sortOrder),
        colorPreset: form.colorPreset,
        pattern: form.pattern,
        ...(form.colorPreset === "custom"
          ? {
              customGradientFrom: form.customGradientFrom,
              customGradientTo: form.customGradientTo,
              customAccent: form.customAccent,
            }
          : {}),
        instagram: form.instagram || undefined,
        youtube: form.youtube || undefined,
        spotify: form.spotify || undefined,
        telegram: form.telegram || undefined,
        photoUrl: form.photoUrl.trim() ? form.photoUrl.trim() : null,
      }),
    });
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as {
        error?: string;
        details?: string;
        field?: string;
      };
      const fieldHint =
        typeof d.field === "string" && d.field ? ` (${d.field})` : "";
      setError(
        typeof d.details === "string"
          ? `${d.error ?? "Памылка"}: ${d.details}${fieldHint}`
          : d.error ?? "Памылка захавання"
      );
    } else {
      setForm(emptyForm);
      setFormOpen(false);
      await load();
      onCatalogChanged?.();
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
      onCatalogChanged?.();
    }
    setDeleting(null);
  };

  const inputCls =
    "px-3 py-2 rounded-lg bg-muted border border-border text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary";
  const labelCls = "text-xs text-muted-foreground mb-1 block";

  const closeFormModal = () => {
    setFormOpen(false);
    setForm(emptyForm);
    setError(null);
  };

  const openNewArtist = () => {
    setForm(emptyForm);
    setError(null);
    setFormOpen(true);
  };

  const coverPreview = useMemo(
    () =>
      resolveArtistVisual({
        colorPreset: form.colorPreset,
        pattern: form.pattern,
        customGradientFrom: form.customGradientFrom,
        customGradientTo: form.customGradientTo,
        customAccent: form.customAccent,
      }),
    [
      form.colorPreset,
      form.pattern,
      form.customGradientFrom,
      form.customGradientTo,
      form.customAccent,
    ]
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Каталог артыстаў і статусы публікацыі. Змены тут адлюстроўваюцца ў песнях і альбомах.
      </p>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between">
          {error}
          <button type="button" onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <AdminFormModal open={formOpen} onClose={closeFormModal} maxWidthClassName="max-w-3xl">
        <h2 className="text-sm font-semibold pr-2">
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

          <div className="md:col-span-2 border-t border-border pt-4 mt-1">
            <p className="text-xs font-medium text-foreground mb-3">Сацыяльныя сеткі</p>
            <p className="text-xs text-muted-foreground mb-3">
              Поўныя спасылкі або без https (напрыклад instagram.com/username). Пуста — кнопка на старонцы не паказваецца.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Instagram</label>
                <input
                  className={inputCls}
                  placeholder="https://instagram.com/…"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>YouTube</label>
                <input
                  className={inputCls}
                  placeholder="https://youtube.com/…"
                  value={form.youtube}
                  onChange={(e) => setForm({ ...form, youtube: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>Spotify</label>
                <input
                  className={inputCls}
                  placeholder="https://open.spotify.com/…"
                  value={form.spotify}
                  onChange={(e) => setForm({ ...form, spotify: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>Telegram</label>
                <input
                  className={inputCls}
                  placeholder="https://t.me/…"
                  value={form.telegram}
                  onChange={(e) => setForm({ ...form, telegram: e.target.value })}
                />
              </div>
            </div>
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

          <AdminImageSourceField
            label="Фота артыста"
            value={form.photoUrl}
            onChange={(url) => setForm({ ...form, photoUrl: url })}
            storageFolder="artists"
            previewShape="circle"
            description="На публічнай старонцы /artists паказваецца круглы аватар замест літары ў цэнтры картачкі (калі загружана)."
          />

          <div className="md:col-span-2 border-t border-border pt-4 mt-1">
            <p className="text-xs font-medium text-foreground mb-3">Заглушка карточкі на старонцы «Артысты»</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Колеравая схема</label>
                <select
                  className={inputCls}
                  value={form.colorPreset}
                  onChange={(e) =>
                    setForm({ ...form, colorPreset: e.target.value as ArtistColorPresetId })
                  }
                >
                  {ARTIST_COLOR_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                  <option value="custom">Уласная палітра (#RRGGBB)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Патэрн</label>
                <select
                  className={inputCls}
                  value={form.pattern}
                  onChange={(e) =>
                    setForm({ ...form, pattern: e.target.value as ArtistPatternId })
                  }
                >
                  {ARTIST_PATTERN_IDS.map((id) => (
                    <option key={id} value={id}>
                      {ARTIST_PATTERN_LABELS[id]}
                    </option>
                  ))}
                </select>
              </div>
              {form.colorPreset === "custom" && (
                <>
                  <div>
                    <label className={labelCls}>Градыент зверху</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="h-10 w-14 rounded border border-border bg-transparent cursor-pointer shrink-0"
                        value={
                          form.customGradientFrom.slice(0, 7).startsWith("#")
                            ? form.customGradientFrom.slice(0, 7)
                            : "#2B5035"
                        }
                        onChange={(e) => setForm({ ...form, customGradientFrom: e.target.value })}
                      />
                      <input
                        className={inputCls}
                        placeholder="#2B5035"
                        value={form.customGradientFrom}
                        onChange={(e) => setForm({ ...form, customGradientFrom: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Градыент ніз</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="h-10 w-14 rounded border border-border bg-transparent cursor-pointer shrink-0"
                        value={
                          form.customGradientTo.slice(0, 7).startsWith("#")
                            ? form.customGradientTo.slice(0, 7)
                            : "#0E1811"
                        }
                        onChange={(e) => setForm({ ...form, customGradientTo: e.target.value })}
                      />
                      <input
                        className={inputCls}
                        placeholder="#0E1811"
                        value={form.customGradientTo}
                        onChange={(e) => setForm({ ...form, customGradientTo: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Акцэнт (патэрн і кнопкі)</label>
                    <div className="flex gap-2 max-w-md">
                      <input
                        type="color"
                        className="h-10 w-14 rounded border border-border bg-transparent cursor-pointer shrink-0"
                        value={
                          form.customAccent.slice(0, 7).startsWith("#")
                            ? form.customAccent.slice(0, 7)
                            : "#7DBF9E"
                        }
                        onChange={(e) => setForm({ ...form, customAccent: e.target.value })}
                      />
                      <input
                        className={inputCls}
                        placeholder="#7DBF9E"
                        value={form.customAccent}
                        onChange={(e) => setForm({ ...form, customAccent: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="mt-4">
              <p className={labelCls}>Перадпрагляд</p>
              <div
                className="relative h-32 max-w-md rounded-xl overflow-hidden border border-border"
                style={{
                  background: `linear-gradient(160deg, ${coverPreview.gradientFrom} 0%, ${coverPreview.gradientTo} 100%)`,
                }}
              >
                <ArtistPattern pattern={coverPreview.pattern as ArtistPatternId} accent={coverPreview.accent} />
                <div
                  className="absolute bottom-2 right-2 w-16 h-16 rounded-full blur-2xl opacity-40 pointer-events-none"
                  style={{ background: coverPreview.accent }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
          >
            {saving ? "Захаванне..." : form.id ? "Абнавіць" : "Дадаць"}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={closeFormModal}
              className="px-4 py-2 rounded-lg border border-border text-sm text-foreground/70 hover:text-foreground"
            >
              Скасаваць
            </button>
          )}
        </div>
      </AdminFormModal>

      <div className="glass rounded-2xl border border-border p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold">
            Спіс ({visibleItems.length}
            {visibleItems.length !== items.length ? ` з ${items.length}` : ""})
          </h2>
          <button
            type="button"
            onClick={openNewArtist}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            Дадаць
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Загружаецца…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Артысты не знойдзены</p>
        ) : visibleItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Нічога не адпавядае пошуку або фільтру публікацыі.
          </p>
        ) : (
          <div className="space-y-2">
            {visibleItems.map((artist) => (
              <div key={artist.id} className="rounded-lg border border-border p-3 flex items-center gap-3">
                {artist.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={artist.photo_url}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full border border-border shrink-0 flex items-center justify-center text-xs font-semibold text-muted-foreground bg-muted"
                    title="Няма фота — паказваецца ініцыял"
                  >
                    {artist.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{artist.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {artist.slug}
                    {artist.genres?.length ? ` · ${artist.genres.join(", ")}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs px-2 py-1 rounded border ${
                      artist.status === "published"
                        ? "border-green-500/30 text-green-600 bg-green-500/10"
                        : artist.status === "archived"
                          ? "border-border text-muted-foreground/60 bg-muted"
                          : "border-border text-muted-foreground bg-muted"
                    }`}
                  >
                    {artist.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => editArtist(artist)}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Рэдагаваць"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteArtist(artist.id)}
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
