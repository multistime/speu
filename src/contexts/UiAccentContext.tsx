"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  isUiAccentPresetId,
  resolveUiAccent,
  type UiAccentPresetId,
} from "@/lib/speu/ui-accent";

type UiAccentContextValue = {
  presetId: UiAccentPresetId;
  accentColor: string;
  accentRgb: string;
  setPreset: (id: UiAccentPresetId) => Promise<boolean>;
  refresh: () => Promise<void>;
};

const UiAccentContext = createContext<UiAccentContextValue | null>(null);

const DEFAULT_PRESET: UiAccentPresetId = "default";

function parsePresetFromProfile(row: unknown): UiAccentPresetId {
  if (!row || typeof row !== "object") return DEFAULT_PRESET;
  const id = (row as Record<string, unknown>).ui_accent_preset_id;
  if (typeof id === "string" && isUiAccentPresetId(id)) return id;
  return DEFAULT_PRESET;
}

export function UiAccentProvider({ children }: { children: React.ReactNode }) {
  const [presetId, setPresetIdState] = useState<UiAccentPresetId>(DEFAULT_PRESET);

  const applyProfileRow = useCallback((row: unknown) => {
    setPresetIdState(parsePresetFromProfile(row));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/user/profile", { credentials: "include" });
      if (!res.ok) {
        setPresetIdState(DEFAULT_PRESET);
        return;
      }
      const data: unknown = await res.json();
      applyProfileRow(data);
    } catch {
      setPresetIdState(DEFAULT_PRESET);
    }
  }, [applyProfileRow]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const run = async (authed: boolean) => {
      if (!authed) {
        if (!cancelled) setPresetIdState(DEFAULT_PRESET);
        return;
      }
      try {
        const res = await fetch("/api/user/profile", { credentials: "include" });
        if (cancelled) return;
        if (!res.ok) {
          setPresetIdState(DEFAULT_PRESET);
          return;
        }
        const data: unknown = await res.json();
        applyProfileRow(data);
      } catch {
        if (!cancelled) setPresetIdState(DEFAULT_PRESET);
      }
    };

    void supabase.auth.getSession().then(({ data: { session } }) => {
      void run(Boolean(session?.user));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void run(Boolean(session?.user));
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [applyProfileRow]);

  const setPreset = useCallback(async (id: UiAccentPresetId) => {
    try {
      const res = await fetch("/api/user/player-prefs", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ui_accent_preset_id: id }),
      });
      if (!res.ok) return false;
      setPresetIdState(id);
      return true;
    } catch {
      return false;
    }
  }, []);

  const { accent: accentColor, accentRgb } = useMemo(
    () => resolveUiAccent(presetId),
    [presetId],
  );

  const value = useMemo<UiAccentContextValue>(
    () => ({
      presetId,
      accentColor,
      accentRgb,
      setPreset,
      refresh,
    }),
    [presetId, accentColor, accentRgb, setPreset, refresh],
  );

  return <UiAccentContext.Provider value={value}>{children}</UiAccentContext.Provider>;
}

export function useUiAccent(): UiAccentContextValue {
  const ctx = useContext(UiAccentContext);
  if (!ctx) {
    const { accent, accentRgb } = resolveUiAccent(DEFAULT_PRESET);
    return {
      presetId: DEFAULT_PRESET,
      accentColor: accent,
      accentRgb: accentRgb,
      setPreset: async () => false,
      refresh: async () => {},
    };
  }
  return ctx;
}
