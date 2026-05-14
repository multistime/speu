"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_FOOTER_CONFIG,
  footerConfigSchema,
  parseFooterConfig,
  type FooterConfig,
  type FooterLinkEntry,
} from "@/lib/footer-config";
import { cn } from "@/lib/utils";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";

const KIND_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "telegram", label: "Telegram" },
  { value: "youtube", label: "YouTube" },
  { value: "spotify", label: "Spotify" },
  { value: "soundcloud", label: "SoundCloud" },
  { value: "link", label: "Іншае (спасылка)" },
] as const;

function newLink(): FooterLinkEntry {
  return { kind: "link", label: "", href: "", enabled: true };
}

function newLegal() {
  return { label: "", href: "#", enabled: true };
}

export default function AdminFooterPage() {
  const [cfg, setCfg] = useState<FooterConfig>(DEFAULT_FOOTER_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/settings");
    if (!res.ok) {
      setError("Не ўдалося загрузіць налады");
      setLoading(false);
      return;
    }
    const { items }: { items: { key: string; value: string }[] } = await res.json();
    const row = items.find((i) => i.key === "footer_config");
    setCfg(parseFooterConfig(row?.value ?? null));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const parsed = footerConfigSchema.safeParse(cfg);
    if (!parsed.success) {
      setError("Праверце палі: няправільны фармат даных");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([
        { key: "footer_config", value: JSON.stringify(parsed.data) },
      ]),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Памылка захавання");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    await load();
  };

  const updateSocial = (i: number, patch: Partial<FooterLinkEntry>) => {
    setCfg((c) => {
      const social = [...c.social];
      social[i] = { ...social[i]!, ...patch };
      return { ...c, social };
    });
  };

  const updateMessenger = (i: number, patch: Partial<FooterLinkEntry>) => {
    setCfg((c) => {
      const messengers = [...c.messengers];
      messengers[i] = { ...messengers[i]!, ...patch };
      return { ...c, messengers };
    });
  };

  const updateLegal = (i: number, patch: Partial<{ label: string; href: string; enabled: boolean }>) => {
    setCfg((c) => {
      const legal = [...c.legal];
      legal[i] = { ...legal[i]!, ...patch };
      return { ...c, legal };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-6">
        <Loader2 className="h-4 w-4 animate-spin" />
        Загружаецца…
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="glass rounded-2xl border border-border p-6">
        <h1 className="font-display text-2xl italic text-foreground mb-2">Футэр сайта</h1>
        <p className="text-sm text-muted-foreground">
          Тэксты, іконкі сацсетак (па тыпе), кантакт, мессенджэры, ніжні радок і юрыдычныя спасылкі.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <section className="glass rounded-2xl border border-border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Тэкст каля лагатыпу</h2>
        <textarea
          className="w-full min-h-[100px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={cfg.brandDescription}
          onChange={(e) => setCfg((c) => ({ ...c, brandDescription: e.target.value }))}
        />
      </section>

      <section className="glass rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Сацыяльныя сеткі (верхні рад іконаў)</h2>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            onClick={() => setCfg((c) => ({ ...c, social: [...c.social, newLink()] }))}
          >
            <Plus className="h-4 w-4" />
            Дадаць
          </button>
        </div>
        <ul className="space-y-3">
          {cfg.social.map((row, i) => (
            <li
              key={`s-${i}`}
              className="flex flex-wrap items-end gap-2 rounded-xl border border-border/80 p-3"
            >
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={row.enabled !== false}
                  onChange={(e) => updateSocial(i, { enabled: e.target.checked })}
                />
                Бачны
              </label>
              <select
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                value={row.kind}
                onChange={(e) => updateSocial(i, { kind: e.target.value })}
              >
                {KIND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                className="flex-1 min-w-[8rem] rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                placeholder="Подпіс (aria)"
                value={row.label}
                onChange={(e) => updateSocial(i, { label: e.target.value })}
              />
              <input
                className="flex-1 min-w-[12rem] rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-mono"
                placeholder="https://"
                value={row.href}
                onChange={(e) => updateSocial(i, { href: e.target.value })}
              />
              <button
                type="button"
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted"
                aria-label="Выдаліць"
                onClick={() =>
                  setCfg((c) => ({ ...c, social: c.social.filter((_, j) => j !== i) }))
                }
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass rounded-2xl border border-border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Блок «Кантакт»</h2>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Уступны тэкст</label>
          <textarea
            className="w-full min-h-[72px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={cfg.contactIntro}
            onChange={(e) => setCfg((c) => ({ ...c, contactIntro: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Email (mailto)</label>
          <input
            type="email"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
            value={cfg.contactEmail}
            onChange={(e) => setCfg((c) => ({ ...c, contactEmail: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Загаловак мессенджэраў</label>
          <input
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={cfg.messengersTitle}
            onChange={(e) => setCfg((c) => ({ ...c, messengersTitle: e.target.value }))}
          />
        </div>
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-xs text-muted-foreground">Кнопкі мессенджэраў</p>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            onClick={() => setCfg((c) => ({ ...c, messengers: [...c.messengers, newLink()] }))}
          >
            <Plus className="h-4 w-4" />
            Дадаць
          </button>
        </div>
        <ul className="space-y-3">
          {cfg.messengers.map((row, i) => (
            <li
              key={`m-${i}`}
              className="flex flex-wrap items-end gap-2 rounded-xl border border-border/80 p-3"
            >
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={row.enabled !== false}
                  onChange={(e) => updateMessenger(i, { enabled: e.target.checked })}
                />
                Бачны
              </label>
              <select
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                value={row.kind}
                onChange={(e) => updateMessenger(i, { kind: e.target.value })}
              >
                {KIND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                className="flex-1 min-w-[8rem] rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                placeholder="Тэкст кнопкі"
                value={row.label}
                onChange={(e) => updateMessenger(i, { label: e.target.value })}
              />
              <input
                className="flex-1 min-w-[12rem] rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-mono"
                placeholder="https://"
                value={row.href}
                onChange={(e) => updateMessenger(i, { href: e.target.value })}
              />
              <button
                type="button"
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted"
                aria-label="Выдаліць"
                onClick={() =>
                  setCfg((c) => ({
                    ...c,
                    messengers: c.messengers.filter((_, j) => j !== i),
                  }))
                }
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass rounded-2xl border border-border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Ніжні радок</h2>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Copyright</label>
          <input
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono"
            value={cfg.copyright}
            onChange={(e) => setCfg((c) => ({ ...c, copyright: e.target.value }))}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Юрыдычныя спасылкі</p>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            onClick={() => setCfg((c) => ({ ...c, legal: [...c.legal, newLegal()] }))}
          >
            <Plus className="h-4 w-4" />
            Дадаць
          </button>
        </div>
        <ul className="space-y-2">
          {cfg.legal.map((row, i) => (
            <li key={`l-${i}`} className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={row.enabled !== false}
                  onChange={(e) => updateLegal(i, { enabled: e.target.checked })}
                />
              </label>
              <input
                className="flex-1 min-w-[6rem] rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                placeholder="Назва"
                value={row.label}
                onChange={(e) => updateLegal(i, { label: e.target.value })}
              />
              <input
                className="flex-1 min-w-[10rem] rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-mono"
                placeholder="URL"
                value={row.href}
                onChange={(e) => updateLegal(i, { href: e.target.value })}
              />
              <button
                type="button"
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive"
                aria-label="Выдаліць"
                onClick={() =>
                  setCfg((c) => ({ ...c, legal: c.legal.filter((_, j) => j !== i) }))
                }
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className={cn(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium",
            "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50",
          )}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Захаваць
        </button>
        {saved && <span className="text-sm text-primary">Захавана</span>}
      </div>
    </div>
  );
}
