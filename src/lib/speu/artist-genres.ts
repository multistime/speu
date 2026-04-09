/**
 * Artist-level genre chips: derived from published track genre tags (not stored on `artists`).
 */

export const TOP_ARTIST_GENRES_LIMIT = 3;

/** Per track, each genre counts at most once; then sort by frequency, then code. */
export function topGenreCodesFromTrackLists(
  perTrackGenres: readonly (readonly string[])[],
  limit = TOP_ARTIST_GENRES_LIMIT
): string[] {
  const counts = new Map<string, number>();
  for (const genres of perTrackGenres) {
    const uniq = new Set(
      genres.filter((g): g is string => typeof g === "string" && g.trim().length > 0)
    );
    for (const g of uniq) {
      counts.set(g, (counts.get(g) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([code]) => code);
}
