"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_UI_ACCENT_PRESET_ID,
  isUiAccentPresetId,
  resolveUiAccent,
  type UiAccentPresetId,
} from "@/lib/speu/ui-accent";
import {
  buildOrnamentBackgroundImage,
  getPresetThemeBundle,
  getTopoSpec,
  getUiThemeCssVarsForMode,
  type TopoSpec,
} from "@/lib/speu/ui-theme-tokens";

function subscribeToHtmlClass(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getDarkModeSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getDarkModeServerSnapshot() {
  return true;
}

type UiAccentContextValue = {
  presetId: UiAccentPresetId;
  accentColor: string;
  accentRgb: string;
  /** Glow / hero: comma-separated RGB for active light/dark mode */
  glowPrimaryRgb: string;
  glowAccentRgb: string;
  topoSpec: TopoSpec;
  setPreset: (id: UiAccentPresetId) => Promise<boolean>;
  refresh: () => Promise<void>;
};

const UiAccentContext = createContext<UiAccentContextValue | null>(null);

function parsePresetFromProfile(row: unknown): UiAccentPresetId {
  if (!row || typeof row !== "object") return DEFAULT_UI_ACCENT_PRESET_ID;
  const id = (row as Record<string, unknown>).ui_accent_preset_id;
  if (typeof id === "string" && isUiAccentPresetId(id)) return id;
  return DEFAULT_UI_ACCENT_PRESET_ID;
}

export function UiAccentProvider({ children }: { children: React.ReactNode }) {
  const [presetId, setPresetIdState] = useState<UiAccentPresetId>(DEFAULT_UI_ACCENT_PRESET_ID);

  const isDark = useSyncExternalStore(
    subscribeToHtmlClass,
    getDarkModeSnapshot,
    getDarkModeServerSnapshot,
  );

  const applyProfileRow = useCallback((row: unknown) => {
    setPresetIdState(parsePresetFromProfile(row));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/user/profile", { credentials: "include" });
      if (!res.ok) {
        setPresetIdState(DEFAULT_UI_ACCENT_PRESET_ID);
        return;
      }
      const data: unknown = await res.json();
      applyProfileRow(data);
    } catch {
      setPresetIdState(DEFAULT_UI_ACCENT_PRESET_ID);
    }
  }, [applyProfileRow]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const run = async (authed: boolean) => {
      if (!authed) {
        if (!cancelled) setPresetIdState(DEFAULT_UI_ACCENT_PRESET_ID);
        return;
      }
      try {
        const res = await fetch("/api/user/profile", { credentials: "include" });
        if (cancelled) return;
        if (!res.ok) {
          setPresetIdState(DEFAULT_UI_ACCENT_PRESET_ID);
          return;
        }
        const data: unknown = await res.json();
        applyProfileRow(data);
      } catch {
        if (!cancelled) setPresetIdState(DEFAULT_UI_ACCENT_PRESET_ID);
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

  useEffect(() => {
    const root = document.documentElement;
    const cssProps = getUiThemeCssVarsForMode(presetId, isDark);
    for (const [key, val] of Object.entries(cssProps)) {
      root.style.setProperty(key, val);
    }
    if (isDark) {
      document.body.style.backgroundImage = "";
    } else {
      const hex = getPresetThemeBundle(presetId).light.ornamentStrokeHex;
      document.body.style.backgroundImage = buildOrnamentBackgroundImage(hex);
    }
  }, [presetId, isDark]);

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

  const modeVars = getPresetThemeBundle(presetId)[isDark ? "dark" : "light"];
  const topoSpec = getTopoSpec(presetId);

  const value = useMemo<UiAccentContextValue>(
    () => ({
      presetId,
      accentColor,
      accentRgb,
      glowPrimaryRgb: modeVars.glowPrimaryRgb,
      glowAccentRgb: modeVars.glowAccentRgb,
      topoSpec,
      setPreset,
      refresh,
    }),
    [presetId, accentColor, accentRgb, modeVars.glowPrimaryRgb, modeVars.glowAccentRgb, topoSpec, setPreset, refresh],
  );

  return <UiAccentContext.Provider value={value}>{children}</UiAccentContext.Provider>;
}

export function useUiAccent(): UiAccentContextValue {
  const ctx = useContext(UiAccentContext);
  if (!ctx) {
    const { accent, accentRgb } = resolveUiAccent(DEFAULT_UI_ACCENT_PRESET_ID);
    const bundle = getPresetThemeBundle(DEFAULT_UI_ACCENT_PRESET_ID);
    const dark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    const modeVars = dark ? bundle.dark : bundle.light;
    return {
      presetId: DEFAULT_UI_ACCENT_PRESET_ID,
      accentColor: accent,
      accentRgb: accentRgb,
      glowPrimaryRgb: modeVars.glowPrimaryRgb,
      glowAccentRgb: modeVars.glowAccentRgb,
      topoSpec: getTopoSpec(DEFAULT_UI_ACCENT_PRESET_ID),
      setPreset: async () => false,
      refresh: async () => {},
    };
  }
  return ctx;
}
