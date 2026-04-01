"use client";

import { useEffect, useState } from "react";
import { Save, Settings, RotateCcw, X, Check, Plus, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Setting = { key: string; value: string; description: string; updated_at: string };

// Keys managed in dedicated sections — hidden from generic list
const RADIO_KEYS = new Set([
  "radio_stream_url",
  "radio_fallback_url",
  "radio_name",
  "radio_enabled",
  "radio_description",
  "radio_nowplaying_url",
]);

const ARTISTS_KEYS = new Set(["artists_show_placeholder"]);

export default function AdminSettingsPage() {
  const [items, setItems] = useState<Setting[]>([]);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // artists_show_placeholder toggle
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [savingPlaceholder, setSavingPlaceholder] = useState(false);

  // New custom key form
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [addingKey, setAddingKey] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/settings");
    if (!res.ok) { setLoading(false); return; }
    const { items: data }: { items: Setting[] } = await res.json();

    // Extract artists_show_placeholder
    const placeholderSetting = data.find((s) => s.key === "artists_show_placeholder");
    if (placeholderSetting) {
      setShowPlaceholder(placeholderSetting.value !== "false");
    }

    setItems(data.filter((s) => !RADIO_KEYS.has(s.key) && !ARTISTS_KEYS.has(s.key)));
    setEdited({});
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    const changed = Object.entries(edited);
    if (changed.length === 0) return;
    setSaving(true);
    setSaved(false);
    setError(null);

    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changed.map(([key, value]) => ({ key, value }))),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Памылка захавання");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await load();
    }
    setSaving(false);
  };

  const togglePlaceholder = async () => {
    const newVal = !showPlaceholder;
    setSavingPlaceholder(true);
    setError(null);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ key: "artists_show_placeholder", value: newVal ? "true" : "false" }]),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Памылка захавання");
    } else {
      setShowPlaceholder(newVal);
    }
    setSavingPlaceholder(false);
  };

  const addKey = async () => {
    if (!newKey.trim()) return;
    setAddingKey(true);
    setError(null);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ key: newKey.trim(), value: newValue }]),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Памылка");
    } else {
      setNewKey("");
      setNewValue("");
      await load();
    }
    setAddingKey(false);
  };

  const getValue = (key: string, fallback: string) =>
    key in edited ? edited[key] : fallback;

  const inputCls = "px-3 py-2 rounded-lg bg-muted border border-border text-sm w-full font-mono focus:outline-none focus:ring-1 focus:ring-primary";
  const labelCls = "text-xs font-mono text-muted-foreground mb-1 block";

  const changedCount = Object.keys(edited).length;

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-5 h-5 text-primary" strokeWidth={1.75} />
          <h1 className="font-display text-2xl italic text-foreground">Наладкі</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Тэхнічныя параметры сайта. Налады радыёстанцыі — у раздзеле Радыё.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {loading ? (
        <div className="glass rounded-2xl border border-border p-6">
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </div>
      ) : (
        <>
          {/* Artists section */}
          <div className="glass rounded-2xl border border-border p-6 space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" strokeWidth={1.75} />
              Артысты
            </h2>

            <div className="flex items-center justify-between gap-4 py-1">
              <div className="flex-1">
                <p className="text-sm font-medium">Паказваць-заглушку на старонцы артыстаў</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Пакуль дадзеныя з базы не загружаны — адлюстроўваць прыклад з артыстамі-заглушкамі
                </p>
              </div>
              <button
                onClick={togglePlaceholder}
                disabled={savingPlaceholder}
                aria-label="Пераключыць заглушку"
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none",
                  showPlaceholder ? "bg-primary" : "bg-muted border border-border",
                  savingPlaceholder && "opacity-60 pointer-events-none"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
                    showPlaceholder ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>

          {/* Existing settings */}
          <div className="glass rounded-2xl border border-border p-6 space-y-5">
            <h2 className="text-sm font-semibold">Параметры сайта</h2>

            {items.length === 0 && (
              <p className="text-sm text-muted-foreground">Параметры не знойдзены</p>
            )}

            {items.map((setting) => (
              <div key={setting.key}>
                <label className={labelCls}>{setting.key}</label>
                {setting.description && (
                  <p className="text-xs text-muted-foreground/70 mb-1">{setting.description}</p>
                )}
                <input
                  className={`${inputCls} ${setting.key in edited ? "border-primary/50" : ""}`}
                  value={getValue(setting.key, setting.value)}
                  onChange={(e) => setEdited((prev) => ({ ...prev, [setting.key]: e.target.value }))}
                />
                {setting.updated_at && (
                  <p className="text-xs text-muted-foreground/50 mt-0.5">
                    Абноўлена: {new Date(setting.updated_at).toLocaleString("be")}
                  </p>
                )}
              </div>
            ))}

            {changedCount > 0 && (
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Захаванне..." : `Захаваць (${changedCount})`}
                </button>
                <button
                  onClick={() => setEdited({})}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-foreground/70 hover:text-foreground"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Скасаваць
                </button>
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm text-green-600">
                    <Check className="w-4 h-4" /> Захавана
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Add new key */}
          <div className="glass rounded-2xl border border-border p-6 space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Plus className="w-4 h-4" /> Дадаць параметр
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Ключ (key)</label>
                <input
                  className={inputCls}
                  placeholder="my_setting_key"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Значэнне (value)</label>
                <input
                  className={inputCls}
                  placeholder="значэнне"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                />
              </div>
            </div>
            <button
              onClick={addKey}
              disabled={addingKey || !newKey.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              {addingKey ? "Даданне..." : "Дадаць"}
            </button>
          </div>

          {/* Danger zone */}
          <div className="glass rounded-2xl border border-destructive/20 p-6 space-y-3">
            <h2 className="text-sm font-semibold text-destructive/80 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Небяспечная зона
            </h2>
            <p className="text-xs text-muted-foreground">
              Для выдалення параметра выдаліце яго значэнне і захавайце — альбо выкарыстайце SQL Editor у Supabase Dashboard.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
