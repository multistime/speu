import { ARTIST_COLOR_PRESETS, type ArtistColorPreset } from "@/lib/artists/visual-theme";

/** Прэсеты палітры акцэнту UI (без custom). */
export const UI_ACCENT_PRESET_IDS = [
  "default",
  "lyasun",
  "vuzel",
  "rasitsa",
  "balota",
  "zhytnik",
] as const;

export type UiAccentPresetId = (typeof UI_ACCENT_PRESET_IDS)[number];

const ID_SET = new Set<string>(UI_ACCENT_PRESET_IDS);

export function isUiAccentPresetId(s: string): s is UiAccentPresetId {
  return ID_SET.has(s);
}

export const UI_ACCENT_PRESETS: readonly ArtistColorPreset[] = ARTIST_COLOR_PRESETS;

const DEFAULT_ACCENT = ARTIST_COLOR_PRESETS[0];

export function resolveUiAccent(presetId: string): { accent: string; accentRgb: string } {
  const p = ARTIST_COLOR_PRESETS.find((x) => x.id === presetId);
  const chosen = p ?? DEFAULT_ACCENT;
  return { accent: chosen.accent, accentRgb: chosen.accentRgb };
}
