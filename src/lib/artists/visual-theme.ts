export const ARTIST_PATTERN_IDS = ["diamond", "waves", "circles", "grid", "fern", "spiral"] as const;
export type ArtistPatternId = (typeof ARTIST_PATTERN_IDS)[number];

export const ARTIST_COLOR_PRESET_IDS = ["default", "lyasun", "vuzel", "rasitsa", "balota", "zhytnik", "custom"] as const;
export type ArtistColorPresetId = (typeof ARTIST_COLOR_PRESET_IDS)[number];

export type ArtistColorPreset = {
  id: Exclude<ArtistColorPresetId, "custom">;
  label: string;
  gradientFrom: string;
  gradientTo: string;
  accent: string;
  accentRgb: string;
};

export const ARTIST_COLOR_PRESETS: ArtistColorPreset[] = [
  {
    id: "default",
    label: "Зелена — купальска / змаўчанне",
    gradientFrom: "#2B5035",
    gradientTo: "#0E1811",
    accent: "#7DBF9E",
    accentRgb: "125, 191, 158",
  },
  {
    id: "lyasun",
    label: "Начны лес",
    gradientFrom: "#1A1A2E",
    gradientTo: "#0D0D1A",
    accent: "#4A7A5A",
    accentRgb: "74, 122, 90",
  },
  {
    id: "vuzel",
    label: "Гарадская сінь",
    gradientFrom: "#0D2340",
    gradientTo: "#060E1A",
    accent: "#6B92C8",
    accentRgb: "107, 146, 200",
  },
  {
    id: "rasitsa",
    label: "Ранішняя бурштына",
    gradientFrom: "#3A1A10",
    gradientTo: "#1A0808",
    accent: "#D4944A",
    accentRgb: "212, 148, 74",
  },
  {
    id: "balota",
    label: "Балотная фіялет",
    gradientFrom: "#2A0D3A",
    gradientTo: "#10061A",
    accent: "#9B6B9B",
    accentRgb: "155, 107, 155",
  },
  {
    id: "zhytnik",
    label: "Жытнёвае золата",
    gradientFrom: "#2A2000",
    gradientTo: "#0E0C00",
    accent: "#C8A830",
    accentRgb: "200, 168, 48",
  },
];

const HEX6 = /^#([0-9A-Fa-f]{6})$/;

export function hexToAccentRgb(hex: string): string {
  const m = HEX6.exec(hex.trim());
  if (!m) return "125, 191, 158";
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function normHex(v: unknown): string {
  const s = String(v ?? "").trim();
  if (!s) return "";
  const x = s.startsWith("#") ? s : `#${s}`;
  return x.toLowerCase();
}

export function isValidHex6(s: string): boolean {
  return HEX6.test(s.trim());
}

export function parsePatternFromVisual(v: unknown): ArtistPatternId {
  const s = String(v ?? "");
  return (ARTIST_PATTERN_IDS as readonly string[]).includes(s) ? (s as ArtistPatternId) : "diamond";
}

/** Падбірае id прэсета па захаваных колерах; калі не супала — custom. */
export function detectColorPreset(visual: Record<string, unknown>): Exclude<ArtistColorPresetId, "custom"> | "custom" {
  const noColors =
    !normHex(visual.gradientFrom) &&
    !normHex(visual.gradientTo) &&
    !normHex(visual.accent);
  if (noColors) return "default";

  const gf = normHex(visual.gradientFrom);
  const gt = normHex(visual.gradientTo);
  const ac = normHex(visual.accent);
  for (const p of ARTIST_COLOR_PRESETS) {
    if (
      normHex(p.gradientFrom) === gf &&
      normHex(p.gradientTo) === gt &&
      normHex(p.accent) === ac
    ) {
      return p.id;
    }
  }
  return "custom";
}

export function resolveArtistVisual(input: {
  colorPreset: string;
  pattern: string;
  customGradientFrom?: string | null;
  customGradientTo?: string | null;
  customAccent?: string | null;
}): Record<string, string> {
  const pattern = (ARTIST_PATTERN_IDS as readonly string[]).includes(input.pattern)
    ? input.pattern
    : "diamond";

  let gradientFrom: string;
  let gradientTo: string;
  let accent: string;

  if (input.colorPreset === "custom") {
    const base = ARTIST_COLOR_PRESETS[0];
    gradientFrom = isValidHex6(input.customGradientFrom ?? "") ? input.customGradientFrom!.trim() : base.gradientFrom;
    gradientTo = isValidHex6(input.customGradientTo ?? "") ? input.customGradientTo!.trim() : base.gradientTo;
    accent = isValidHex6(input.customAccent ?? "") ? input.customAccent!.trim() : base.accent;
  } else {
    const preset = ARTIST_COLOR_PRESETS.find((p) => p.id === input.colorPreset) ?? ARTIST_COLOR_PRESETS[0];
    gradientFrom = preset.gradientFrom;
    gradientTo = preset.gradientTo;
    accent = preset.accent;
  }

  const accentRgb = hexToAccentRgb(accent);
  return { gradientFrom, gradientTo, accent, accentRgb, pattern };
}

export const ARTIST_PATTERN_LABELS: Record<ArtistPatternId, string> = {
  diamond: "Ромбы",
  waves: "Хвалі",
  circles: "Кола",
  grid: "Сетка",
  fern: "Папараць",
  spiral: "Спіраль",
};
