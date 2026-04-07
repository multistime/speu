import "server-only";

import { Readable } from "node:stream";
import { parseStream } from "music-metadata";

const FETCH_TIMEOUT_MS = 25_000;

/**
 * Limits where we will fetch audio for duration probing (SSRF mitigation).
 */
export function isAllowedAudioProbeUrl(urlStr: string): boolean {
  let u: URL;
  try {
    u = new URL(urlStr);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (host.endsWith(".supabase.co")) return true;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (base) {
    try {
      const h = new URL(base).hostname.toLowerCase();
      if (host === h) return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

function normalizeDurationSec(seconds: number | undefined): number | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return null;
  return Math.min(86400, Math.round(seconds));
}

/**
 * Reads duration from a remote audio file (metadata). Returns seconds or null.
 * Use only for URLs passing {@link isAllowedAudioProbeUrl}.
 */
export async function resolveDurationSecFromAudioUrl(
  urlStr: string | null | undefined
): Promise<number | null> {
  const trimmed = urlStr?.trim();
  if (!trimmed || !isAllowedAudioProbeUrl(trimmed)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(trimmed, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "SpeuDurationProbe/1.0",
        Accept: "audio/*,*/*;q=0.8",
      },
    });
    if (!res.ok || !res.body) return null;

    const readable = Readable.fromWeb(res.body as import("stream/web").ReadableStream);
    const mime = res.headers.get("content-type")?.split(";")[0]?.trim() || undefined;
    const meta = await parseStream(readable, mime, { duration: true });
    return normalizeDurationSec(meta.format.duration);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
