"use client";

import { useEffect, useState } from "react";
import { Save, Radio, RotateCcw, X, Check } from "lucide-react";

type Setting = { key: string; value: string; description: string };

const RADIO_KEYS = [
  "radio_stream_url",
  "radio_fallback_url",
  "radio_name",
  "radio_enabled",
  "radio_description",
  "radio_nowplaying_url",
];

const LABELS: Record<string, string> = {
  radio_stream_url:     "Асноўны URL стрыму",
  radio_fallback_url:   "Рэзервовы URL стрыму",
  radio_name:           "Назва радыёстанцыі",
  radio_enabled:        "Радыё ўключана",
  radio_description:    "Апісанне",
  radio_nowplaying_url: "Now-playing API URL",
};

const HINTS: Record<string, string> = {
  radio_stream_url:     "Icecast, SHOUTcast або HLS (.m3u8) URL",
  radio_fallback_url:   "Запасны URL, калі асноўны недаступны",
  radio_name:           "Адлюстроўваецца на старонцы Радыё",
  radio_enabled:        "true — паказваць плэер; false — схаваць",
  radio_description:    "Кароткае апісанне, видимае слухачам",
  radio_nowplaying_url: "Эндпоінт для атрымання назвы бягучага трэка",
};

export default function AdminRadioPage() {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/settings");
    if (!res.ok) { setLoading(false); return; }
    const { items }: { items: Setting[] } = await res.json();
    const map: Record<string, string> = {};
    items.forEach((s) => { map[s.key] = s.value ?? ""; });
    setFields(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);

    const payload = RADIO_KEYS.map((key) => ({ key, value: fields[key] ?? "" }));

    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Памылка захавання");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const inputCls = "px-3 py-2 rounded-lg bg-muted border border-border text-sm w-full font-mono focus:outline-none focus:ring-1 focus:ring-primary";
  const labelCls = "text-sm font-medium text-foreground";
  const hintCls  = "text-xs text-muted-foreground mt-0.5";

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-2">
          <Radio className="w-5 h-5 text-primary" strokeWidth={1.75} />
          <h1 className="font-display text-2xl italic text-foreground">Радыё</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Налады стрымінгу. Змены захоўваюцца ў базе і адразу ўступаюць у сілу.
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
        <div className="glass rounded-2xl border border-border p-6 space-y-6">

          {/* Toggle */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <p className={labelCls}>{LABELS["radio_enabled"]}</p>
              <p className={hintCls}>{HINTS["radio_enabled"]}</p>
            </div>
            <button
              onClick={() => setFields((f) => ({ ...f, radio_enabled: f.radio_enabled === "true" ? "false" : "true" }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                fields["radio_enabled"] === "true" ? "bg-primary" : "bg-muted border border-border"
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                fields["radio_enabled"] === "true" ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>

          {/* Text fields */}
          {RADIO_KEYS.filter((k) => k !== "radio_enabled").map((key) => (
            <div key={key}>
              <label className={labelCls}>{LABELS[key]}</label>
              <p className={hintCls}>{HINTS[key]}</p>
              <input
                className={`${inputCls} mt-2`}
                placeholder={key === "radio_stream_url" ? "https://stream.example.com:8000/radio" : ""}
                value={fields[key] ?? ""}
                onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}

          {/* Stream preview */}
          {fields["radio_stream_url"] && (
            <div className="rounded-lg bg-muted/60 border border-border p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Тэст плэера</p>
              <audio controls src={fields["radio_stream_url"]} className="w-full h-8" />
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? "Захаванне..." : "Захаваць"}
            </button>
            <button
              onClick={load}
              disabled={loading || saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-foreground/70 hover:text-foreground disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Скінуць
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <Check className="w-4 h-4" /> Захавана
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
