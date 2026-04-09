"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  MAX_GENRES_PER_TRACK,
  filterGenreSuggestions,
  getGenreLabelBe,
  resolveGenreToken,
} from "@/lib/speu/genre-taxonomy";
import { cn } from "@/lib/utils";

type Props = {
  value: string[];
  onChange: (codes: string[]) => void;
  disabled?: boolean;
  max?: number;
};

export function SubmissionGenrePicker({ value, onChange, disabled, max = MAX_GENRES_PER_TRACK }: Props) {
  const [draft, setDraft] = useState("");
  const suggestions = useMemo(() => filterGenreSuggestions(draft, 14), [draft]);

  const addCode = (code: string) => {
    if (disabled) return;
    if (value.includes(code) || value.length >= max) return;
    onChange([...value, code]);
    setDraft("");
  };

  const tryAddFromInput = () => {
    const t = draft.trim();
    if (!t) return;
    const code = resolveGenreToken(t);
    if (code) {
      addCode(code);
      return;
    }
    const exact = suggestions.find(
      (s) => s.labelBe.toLowerCase() === t.toLowerCase() || s.code === t.toLowerCase().replace(/\s+/g, "_")
    );
    if (exact) addCode(exact.code);
  };

  const removeAt = (idx: number) => {
    if (disabled) return;
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[1.75rem]">
        {value.length === 0 ? (
          <span className="text-xs text-muted-foreground">Пакуль без жанраў — дадайце ад 1 да {max}.</span>
        ) : (
          value.map((code, idx) => (
            <span
              key={`${code}-${idx}`}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/50 px-2 py-0.5 text-xs text-foreground"
            >
              {getGenreLabelBe(code)}
              {!disabled ? (
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="rounded p-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  aria-label="Выдаліць жанр"
                >
                  <X className="size-3.5" strokeWidth={2} />
                </button>
              ) : null}
            </span>
          ))
        )}
      </div>

      {!disabled && value.length < max ? (
        <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                tryAddFromInput();
              }
            }}
            placeholder="Пачніце ўводзіць або абярыце зі спісу…"
            disabled={disabled}
            className="w-full min-h-10 px-3 py-2 text-sm bg-transparent border-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/25"
          />
          {draft.trim().length > 0 && suggestions.length > 0 ? (
            <ul className="border-t border-border max-h-40 overflow-y-auto py-1">
              {suggestions.map((s) => (
                <li key={s.code}>
                  <button
                    type="button"
                    disabled={value.includes(s.code)}
                    onClick={() => addCode(s.code)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-xs hover:bg-muted/80 disabled:opacity-40",
                      value.includes(s.code) && "text-muted-foreground"
                    )}
                  >
                    {s.labelBe}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <p className="text-[11px] text-muted-foreground">
        Засталося слотаў: {Math.max(0, max - value.length)}. Enter — дадаць па назве.
      </p>
    </div>
  );
}
