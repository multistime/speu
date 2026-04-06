export function pickAudioUrl(row: {
  audio_url?: string | null;
  external_url?: string | null;
}): string | null {
  const a = row.audio_url?.trim();
  if (a) return a;
  const e = row.external_url?.trim();
  if (e) return e;
  return null;
}
