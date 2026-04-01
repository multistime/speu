"use client";

import { useEffect, useState } from "react";

type ContentPageItem = {
  id: number;
  slug: string;
  title: string;
  status: string;
  content_blocks?: Array<{
    id: number;
    block_key: string;
    block_type: string;
    payload_json: Record<string, unknown>;
  }>;
};

export default function AdminContentPage() {
  const [items, setItems] = useState<ContentPageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    pageSlug: "home",
    blockKey: "custom_cta",
    blockType: "cta",
    title: "",
    description: "",
    buttonLabel: "",
    buttonHref: "",
  });

  const load = async () => {
    setLoading(true);
    const response = await fetch("/api/admin/content");
    const data = await response.json();
    setItems(data.items ?? []);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    fetch("/api/admin/content")
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
    await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageSlug: form.pageSlug,
        blockKey: form.blockKey,
        blockType: form.blockType,
        payload: {
          title: form.title,
          description: form.description,
          button: { label: form.buttonLabel, href: form.buttonHref },
        },
      }),
    });
    setSaving(false);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-border p-6">
        <h1 className="font-display text-2xl italic text-foreground mb-2">Контент сайта</h1>
        <p className="text-sm text-muted-foreground">
          Редактирование текстов, CTA и блоков страниц через CMS-слой.
        </p>
      </div>

      <div className="glass rounded-2xl border border-border p-6 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Добавить/обновить блок</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <input className="px-3 py-2 rounded-lg bg-muted border border-border text-sm" placeholder="page slug" value={form.pageSlug} onChange={(e) => setForm({ ...form, pageSlug: e.target.value })} />
          <input className="px-3 py-2 rounded-lg bg-muted border border-border text-sm" placeholder="block key" value={form.blockKey} onChange={(e) => setForm({ ...form, blockKey: e.target.value })} />
          <input className="px-3 py-2 rounded-lg bg-muted border border-border text-sm" placeholder="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="px-3 py-2 rounded-lg bg-muted border border-border text-sm" placeholder="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className="px-3 py-2 rounded-lg bg-muted border border-border text-sm" placeholder="button label" value={form.buttonLabel} onChange={(e) => setForm({ ...form, buttonLabel: e.target.value })} />
          <input className="px-3 py-2 rounded-lg bg-muted border border-border text-sm" placeholder="button href" value={form.buttonHref} onChange={(e) => setForm({ ...form, buttonHref: e.target.value })} />
        </div>
        <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
          {saving ? "Сохранение..." : "Сохранить блок"}
        </button>
      </div>

      <div className="glass rounded-2xl border border-border p-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Текущие страницы и блоки</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        ) : (
          <div className="space-y-3">
            {items.map((page) => (
              <div key={page.id} className="rounded-xl border border-border p-4">
                <p className="text-sm font-semibold">{page.title} <span className="text-muted-foreground">({page.slug})</span></p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(page.content_blocks ?? []).map((block) => (
                    <span key={block.id} className="text-xs px-2 py-1 rounded-md bg-muted border border-border">
                      {block.block_key}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
