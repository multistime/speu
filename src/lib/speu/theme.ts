import { parsePatternFromVisual, type ArtistPatternId } from "@/lib/artists/visual-theme";

export type SpeuArtistTheme = {
  gradientFrom: string;
  gradientTo: string;
  accent: string;
  accentRgb: string;
  pattern: ArtistPatternId;
};

export function themeFromVisualJson(
  visual: Record<string, unknown> | null | undefined
): SpeuArtistTheme {
  const v = visual ?? {};
  return {
    gradientFrom: typeof v.gradientFrom === "string" ? v.gradientFrom : "#2B5035",
    gradientTo: typeof v.gradientTo === "string" ? v.gradientTo : "#0E1811",
    accent: typeof v.accent === "string" ? v.accent : "#7DBF9E",
    accentRgb: typeof v.accentRgb === "string" ? v.accentRgb : "125, 191, 158",
    pattern: parsePatternFromVisual(v.pattern),
  };
}
