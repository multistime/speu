"use client";

import { useEffect, useState } from "react";
import { Trash2, Pencil, Plus, X } from "lucide-react";
import { AdminFormModal } from "@/components/admin/AdminFormModal";

type Tier = {
  id: string;
  code: string;
  name: string;
  label_be: string | null;
  description: string | null;
  price_amount: number;
  currency: string;
  period: string;
  perks: string[];
  highlighted: boolean;
  accent_color: string | null;
  glow_rgb: string | null;
  is_active: boolean;
  sort_order: number;
};

const emptyForm = {
  id: "",
  code: "",
  name: "",
  labelBe: "",
  description: "",
  priceAmount: "5",
  currency: "USD",
  period: "/мес",
  perksText: "",
  highlighted: false,
  accentColor: "",
  glowRgb: "",
  isActive: true,
  sortOrder: "0",
};

export default function AdminSupportTiersPage() {
  const [items, setItems] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/support-tiers");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const editTier = (tier: Tier) => {
    setForm({
      id: tier.id,
      code: tier.code,
      name: tier.name,
      labelBe: tier.label_be ?? "",
      description: tier.description ?? "",
      priceAmount: String(tier.price_amount),
      currency: tier.currency,
      period: tier.period,
      perksText: Array.isArray(tier.perks) ? tier.perks.join("\n") : "",
      highlighted: tier.highlighted,
      accentColor: tier.accent_color ?? "",
      glowRgb: tier.glow_rgb ?? "",
      isActive: tier.is_active,
      sortOrder: String(tier.sort_order),
    });
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.code || !form.name) {
      setError("Патрабуецца код і назва");
      return;
    }
    setSaving(true);
    setError(null);

    const perks = form.perksText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await fetch("/api/admin/support-tiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: form.id || undefined,
        code: form.code,
        name: form.name,
        labelBe: form.labelBe || undefined,
        description: form.description || undefined,
        priceAmount: Number(form.priceAmount),
        currency: form.currency,
        period: form.period,
        perks,
        highlighted: form.highlighted,
        accentColor: form.accentColor || undefined,
        glowRgb: form.glowRgb || undefined,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder),
      }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Памылка захавання");
    } else {
      setForm(emptyForm);
      setFormOpen(false);
      await load();
    }
    setSaving(false);
  };

  const deleteTier = async (id: string) => {
    if (!confirm("Выдаліць узровень падтрымкі?")) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/support-tiers/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Памылка выдалення");
    } else {
      await load();
    }
    setDeleting(null);
  };

  const closeFormModal = () => {
    setFormOpen(false);
    setForm(emptyForm);
    setError(null);
  };

  const openNewTier = () => {
    setForm(emptyForm);
    setError(null);
    setFormOpen(true);
  };

  const inputCls = "px-3 py-2 rounded-lg bg-muted border border-border text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary";
  const labelCls = "text-xs text-muted-foreground mb-1 block";

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-border p-6">
        <h1 className="font-display text-2xl italic text-foreground mb-2">Узроўні падтрымкі</h1>
        <p className="text-sm text-muted-foreground">Рэдагаванне тарыфаў падпіскі.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <AdminFormModal open={formOpen} onClose={closeFormModal} maxWidthClassName="max-w-2xl">
        <h2 className="text-sm font-semibold pr-2">
          {form.id ? "Рэдагаваць узровень" : "Дадаць узровень"}
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Код (унікальны, напр. supporter) *</label>
            <input
              className={inputCls}
              placeholder="code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </div>

          <div>
            <label className={labelCls}>Назва *</label>
            <input
              className={inputCls}
              placeholder="Назва"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className={labelCls}>Назва па-беларуску</label>
            <input
              className={inputCls}
              placeholder="Падтрымальнік"
              value={form.labelBe}
              onChange={(e) => setForm({ ...form, labelBe: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>Апісанне</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <label className={labelCls}>Цана</label>
            <input
              className={inputCls}
              type="number"
              min="0"
              step="0.01"
              value={form.priceAmount}
              onChange={(e) => setForm({ ...form, priceAmount: e.target.value })}
            />
          </div>

          <div>
            <label className={labelCls}>Валюта</label>
            <input
              className={inputCls}
              placeholder="USD"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            />
          </div>

          <div>
            <label className={labelCls}>Перыяд (напр. /мес)</label>
            <input
              className={inputCls}
              placeholder="/мес"
              value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value })}
            />
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

          <div className="md:col-span-2">
            <label className={labelCls}>Перавагі (кожная з новай радкі)</label>
            <textarea
              className={`${inputCls} resize-none font-mono text-xs`}
              rows={5}
              placeholder={"Ранні доступ да новых выданняў\nІмя ў альбомных крэдытах\n..."}
              value={form.perksText}
              onChange={(e) => setForm({ ...form, perksText: e.target.value })}
            />
          </div>

          <div>
            <label className={labelCls}>Колер акцэнту (hex)</label>
            <div className="flex gap-2 items-center">
              <input
                className={inputCls}
                placeholder="#35654D"
                value={form.accentColor}
                onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
              />
              {form.accentColor && (
                <div
                  className="w-8 h-8 rounded border border-border shrink-0"
                  style={{ background: form.accentColor }}
                />
              )}
            </div>
          </div>

          <div>
            <label className={labelCls}>Glow RGB (напр. 53, 101, 77)</label>
            <input
              className={inputCls}
              placeholder="53, 101, 77"
              value={form.glowRgb}
              onChange={(e) => setForm({ ...form, glowRgb: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.highlighted}
                onChange={(e) => setForm({ ...form, highlighted: e.target.checked })}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm">Вылучыць</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm">Актыўны</span>
            </label>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={save}
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

      {/* List */}
      <div className="glass rounded-2xl border border-border p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold">Спіс ({items.length})</h2>
          <button
            type="button"
            onClick={openNewTier}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            Дадаць
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Загружаецца…</p>
        ) : (
          <div className="space-y-2">
            {items.map((tier) => (
              <div key={tier.id} className="rounded-lg border border-border p-4 flex items-start gap-3">
                {tier.accent_color && (
                  <div
                    className="w-1 self-stretch rounded-full shrink-0"
                    style={{ background: tier.accent_color }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{tier.name}</p>
                    {tier.highlighted && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 border border-amber-500/30">highlighted</span>
                    )}
                    {!tier.is_active && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground">неактыўны</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tier.code} · {tier.price_amount} {tier.currency}{tier.period}
                  </p>
                  {Array.isArray(tier.perks) && tier.perks.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {tier.perks.map((perk, i) => (
                        <li key={i} className="text-xs text-muted-foreground">· {perk}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => editTier(tier)}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Рэдагаваць"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteTier(tier.id)}
                    disabled={deleting === tier.id}
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
