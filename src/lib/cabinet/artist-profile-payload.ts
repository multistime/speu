import { z } from "zod";
import { parseArtistSocialLinksFromForm } from "@/lib/artists/social-links";
import {
  ARTIST_COLOR_PRESET_IDS,
  ARTIST_PATTERN_IDS,
  isValidHex6,
  resolveArtistVisual,
} from "@/lib/artists/visual-theme";
import { isLikelyImageUrl } from "@/lib/admin/image-upload";

const colorPresetEnum = z.enum(ARTIST_COLOR_PRESET_IDS);
const colorPresetField = z
  .union([colorPresetEnum, z.literal("default")])
  .transform((v) => (v === "default" ? "paparat" : v));
const patternEnum = z.enum(ARTIST_PATTERN_IDS);

export const cabinetArtistProfilePatchSchema = z
  .object({
    name: z.string().min(1),
    nameEn: z.string().optional(),
    tagline: z.string().optional(),
    bio: z.string().optional(),
    location: z.string().optional(),
    yearStarted: z.number().int().optional().nullable(),
    initials: z.string().optional(),
    colorPreset: colorPresetField.default("paparat"),
    pattern: patternEnum.default("diamond"),
    customGradientFrom: z.string().optional(),
    customGradientTo: z.string().optional(),
    customAccent: z.string().optional(),
    instagram: z.string().optional(),
    youtube: z.string().optional(),
    spotify: z.string().optional(),
    telegram: z.string().optional(),
    photoUrl: z.union([z.string(), z.null()]).optional(),
  })
  .superRefine((data, ctx) => {
    if (typeof data.photoUrl === "string") {
      const t = data.photoUrl.trim();
      if (t && !isLikelyImageUrl(t)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Некарэктны URL фота",
          path: ["photoUrl"],
        });
      }
    }
    if (data.colorPreset !== "custom") return;
    const checks = [
      [data.customGradientFrom?.trim() ?? "", "customGradientFrom"] as const,
      [data.customGradientTo?.trim() ?? "", "customGradientTo"] as const,
      [data.customAccent?.trim() ?? "", "customAccent"] as const,
    ];
    for (const [val, path] of checks) {
      if (!isValidHex6(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Колер у фармаце #RRGGBB",
          path: [path],
        });
      }
    }
  });

export type CabinetArtistProfilePatch = z.infer<typeof cabinetArtistProfilePatchSchema>;

export function buildCabinetArtistProfileUpdateRow(
  data: CabinetArtistProfilePatch,
  userId: string
): { ok: true; row: Record<string, unknown> } | { ok: false; message: string; field?: string } {
  const socialParsed = parseArtistSocialLinksFromForm({
    instagram: data.instagram,
    youtube: data.youtube,
    spotify: data.spotify,
    telegram: data.telegram,
  });
  if (!socialParsed.ok) {
    return { ok: false, message: socialParsed.message, field: socialParsed.field };
  }

  const visual_json = resolveArtistVisual({
    colorPreset: data.colorPreset,
    pattern: data.pattern,
    customGradientFrom: data.customGradientFrom,
    customGradientTo: data.customGradientTo,
    customAccent: data.customAccent,
  });

  const row: Record<string, unknown> = {
    name: data.name,
    name_en: data.nameEn?.trim() ? data.nameEn.trim() : null,
    tagline: data.tagline?.trim() ? data.tagline.trim() : null,
    bio: data.bio?.trim() ? data.bio.trim() : null,
    location: data.location?.trim() ? data.location.trim() : null,
    year_started: data.yearStarted ?? null,
    initials: data.initials?.trim() ? data.initials.trim() : null,
    social_links: socialParsed.social_links,
    visual_json,
    updated_by: userId,
  };

  if (data.photoUrl !== undefined) {
    row.photo_url =
      data.photoUrl === null ? null : data.photoUrl.trim() ? data.photoUrl.trim() : null;
  }

  return { ok: true, row };
}
