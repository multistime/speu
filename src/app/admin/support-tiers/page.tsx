"use client";

import { useEffect, useState } from "react";

type Tier = {
  id: string;
  code: string;
  name: string;
  price_amount: number;
  period: string;
  highlighted: boolean;
  is_active: boolean;
};

export default function AdminSupportTiersPage() {
  const [items, setItems] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    priceAmount: "5",
    period: "/мес",
    highlighted: false,
  });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/support-tiers");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    fetch("/api/admin/support-tiers")
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
    await fetch("/api/admin/support-tiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        name: form.name,
        priceAmount: Number(form.priceAmount),
        period: form.period,
        highlighted: form.highlighted,
        perks: [],
      }),
    });
    setSaving(false);
    setForm({ code: "", name: "", priceAmount: "5", period: "/мес", highlighted: false });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-border p-6">
        <h1 className="font-display text-2xl italic text-foreground mb-2">Узроўні падтрымкі</h1>
        <p className="text-sm text-muted-foreground">Редактирование тарифов подписки.</p>
      </div>

      <div className="glass rounded-2xl border border-border p-6 space-y-3">
        <h2 className="text-sm font-semibold">Добавить/обновить уровень</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <input className="px-3 py-2 rounded-lg bg-muted border border-border text-sm" placeholder="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <input className="px-3 py-2 rounded-lg bg-muted border border-border text-sm" placeholder="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="px-3 py-2 rounded-lg bg-muted border border-border text-sm" placeholder="price" value={form.priceAmount} onChange={(e) => setForm({ ...form, priceAmount: e.target.value })} />
          <input className="px-3 py-2 rounded-lg bg-muted border border-border text-sm" placeholder="period" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
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
            {items.map((tier) => (
              <div key={tier.id} className="rounded-lg border border-border p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{tier.name}</p>
                  <p className="text-xs text-muted-foreground">{tier.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">${tier.price_amount}{tier.period}</p>
                  <p className="text-xs text-muted-foreground">{tier.highlighted ? "highlighted" : "normal"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
