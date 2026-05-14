import { z } from "zod";

const linkEntrySchema = z.object({
  kind: z.string(),
  label: z.string(),
  href: z.string(),
  enabled: z.boolean().optional(),
});

const legalEntrySchema = z.object({
  label: z.string(),
  href: z.string(),
  enabled: z.boolean().optional(),
});

export const footerConfigSchema = z.object({
  brandDescription: z.string(),
  social: z.array(linkEntrySchema),
  contactIntro: z.string(),
  contactEmail: z.string(),
  messengersTitle: z.string(),
  messengers: z.array(linkEntrySchema),
  copyright: z.string(),
  legal: z.array(legalEntrySchema),
});

export type FooterConfig = z.infer<typeof footerConfigSchema>;
export type FooterLinkEntry = z.infer<typeof linkEntrySchema>;

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  brandDescription:
    "Беларускі музычны лейбл. Ствараем і падтрымліваем арыгінальную музыку на беларускай мове.",
  social: [
    { kind: "instagram", label: "Instagram", href: "https://instagram.com/speu_label", enabled: true },
    { kind: "telegram", label: "Telegram", href: "https://t.me/speu_label", enabled: true },
    { kind: "youtube", label: "YouTube", href: "https://youtube.com/@speu_label", enabled: true },
    { kind: "spotify", label: "Spotify", href: "https://open.spotify.com", enabled: true },
    { kind: "soundcloud", label: "SoundCloud", href: "https://soundcloud.com/speu_label", enabled: true },
  ],
  contactIntro: "Цікавіць супрацоўніцтва? Пішыце нам.",
  contactEmail: "hello@speu.by",
  messengersTitle: "Мы ў мессенджэрах:",
  messengers: [
    { kind: "telegram", label: "Telegram", href: "https://t.me/speu_label", enabled: true },
    { kind: "instagram", label: "Instagram", href: "https://instagram.com/speu_label", enabled: true },
  ],
  copyright: "© 2026 Спеў. Корань у мове.",
  legal: [
    { label: "Прыватнасць", href: "#", enabled: true },
    { label: "Умовы", href: "#", enabled: true },
  ],
};

function normalizeEnabled<T extends { enabled?: boolean }>(rows: T[]): (T & { enabled: boolean })[] {
  return rows.map((r) => ({ ...r, enabled: r.enabled !== false }));
}

export function parseFooterConfig(raw: string | null | undefined): FooterConfig {
  if (!raw?.trim()) {
    return DEFAULT_FOOTER_CONFIG;
  }
  try {
    const json: unknown = JSON.parse(raw);
    const parsed = footerConfigSchema.safeParse(json);
    if (!parsed.success) {
      return DEFAULT_FOOTER_CONFIG;
    }
    const d = parsed.data;
    return {
      brandDescription: d.brandDescription || DEFAULT_FOOTER_CONFIG.brandDescription,
      social:
        d.social?.length > 0
          ? normalizeEnabled(d.social)
          : DEFAULT_FOOTER_CONFIG.social,
      contactIntro: d.contactIntro || DEFAULT_FOOTER_CONFIG.contactIntro,
      contactEmail: d.contactEmail || DEFAULT_FOOTER_CONFIG.contactEmail,
      messengersTitle: d.messengersTitle || DEFAULT_FOOTER_CONFIG.messengersTitle,
      messengers:
        d.messengers?.length > 0
          ? normalizeEnabled(d.messengers)
          : DEFAULT_FOOTER_CONFIG.messengers,
      copyright: d.copyright || DEFAULT_FOOTER_CONFIG.copyright,
      legal:
        d.legal?.length > 0
          ? normalizeEnabled(d.legal)
          : DEFAULT_FOOTER_CONFIG.legal,
    };
  } catch {
    return DEFAULT_FOOTER_CONFIG;
  }
}
