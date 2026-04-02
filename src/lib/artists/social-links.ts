export const ARTIST_SOCIAL_KEYS = ["instagram", "youtube", "spotify", "telegram"] as const;
export type ArtistSocialKey = (typeof ARTIST_SOCIAL_KEYS)[number];

/** Accepts full URLs or host/path; returns https URL or null if invalid. */
export function normalizeArtistSocialUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  let candidate = s;
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

export function parseArtistSocialLinksFromForm(input: {
  instagram?: string;
  youtube?: string;
  spotify?: string;
  telegram?: string;
}):
  | { ok: true; social_links: Record<string, string> }
  | { ok: false; field: ArtistSocialKey; message: string } {
  const social_links: Record<string, string> = {};
  for (const key of ARTIST_SOCIAL_KEYS) {
    const raw = input[key];
    if (typeof raw !== "string") continue;
    const t = raw.trim();
    if (!t) continue;
    const n = normalizeArtistSocialUrl(t);
    if (!n) return { ok: false, field: key, message: "Няслушная спасылка" };
    social_links[key] = n;
  }
  return { ok: true, social_links };
}
