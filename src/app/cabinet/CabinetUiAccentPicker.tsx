"use client";

import { useState } from "react";
import { Palette } from "lucide-react";
import { useUiAccent } from "@/contexts/UiAccentContext";
import {
  UI_ACCENT_PRESETS,
  type UiAccentPresetId,
} from "@/lib/speu/ui-accent";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function accentSwatch(accent: string) {
  return (
    <span
      className="size-4 shrink-0 rounded-full border border-border/60 shadow-inner"
      style={{ background: accent }}
      aria-hidden
    />
  );
}

export function CabinetUiAccentPicker() {
  const { presetId, setPreset } = useUiAccent();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = async (id: UiAccentPresetId) => {
    if (id === presetId) return;
    setErr(null);
    setBusy(true);
    const ok = await setPreset(id);
    setBusy(false);
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

      <Select
        value={presetId}
        onValueChange={(v) => void pick(v as UiAccentPresetId)}
        disabled={busy}
      >
        <SelectTrigger className="mt-4 w-full max-w-md">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {UI_ACCENT_PRESETS.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {accentSwatch(p.accent)}
              <span className="truncate">{p.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {err ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {err}
        </p>
      ) : null}
    </div>
  );
}
