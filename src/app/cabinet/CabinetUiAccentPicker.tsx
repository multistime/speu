"use client";

import { useState } from "react";
import { Loader2, Palette } from "lucide-react";
import { useUiAccent } from "@/contexts/UiAccentContext";
import {
  UI_ACCENT_PRESETS,
  type UiAccentPresetId,
} from "@/lib/speu/ui-accent";
import { cn } from "@/lib/utils";

export function CabinetUiAccentPicker() {
  const { presetId, setPreset } = useUiAccent();
  const [busyId, setBusyId] = useState<UiAccentPresetId | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const pick = async (id: UiAccentPresetId) => {
    if (id === presetId) return;
    setErr(null);
    setBusyId(id);
    const ok = await setPreset(id);
    setBusyId(null);
    if (!ok) setErr("Не ўдалося захаваць. Паспрабуйце яшчэ раз.");
  };

  return (
    <div className="glass rounded-2xl border border-border p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40">
          <Palette className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold text-foreground italic">
            Акцэнт інтэрфейсу
          </h2>
          <p className="mt-1 text-sm text-muted-foreground leading-snug">
            Колер акцэнту ў хабе «Спеў» і глабальным плэеры. Па змаўчанні — купальскае зелена.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {UI_ACCENT_PRESETS.map((p) => {
          const selected = presetId === p.id;
          const busy = busyId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              disabled={busy}
              onClick={() => void pick(p.id)}
              className={cn(
                "flex flex-col items-stretch gap-2 rounded-xl border p-3 text-left transition-colors",
                selected
                  ? "border-primary/50 bg-primary/8 ring-1 ring-primary/25"
                  : "border-border bg-card/40 hover:border-border hover:bg-muted/35",
                busy && "opacity-70",
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className="size-8 shrink-0 rounded-full border border-border/60 shadow-inner"
                  style={{ background: p.accent }}
                  aria-hidden
                />
                {busy ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                ) : null}
              </span>
              <span className="text-xs font-medium leading-snug text-foreground">{p.label}</span>
            </button>
          );
        })}
      </div>

      {err ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {err}
        </p>
      ) : null}
    </div>
  );
}
