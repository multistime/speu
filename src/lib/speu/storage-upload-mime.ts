/**
 * Supabase Storage validates uploads against `storage.buckets.allowed_mime_types`.
 * Browsers often send empty `File.type`, `application/octet-stream`, or legacy MIME names.
 */
export function imageUploadContentType(file: File): string {
  const t = file.type?.trim();
  if (t && t !== "application/octet-stream") {
    if (t === "image/x-png") return "image/png";
    return t;
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "image/jpeg";
  }
}

/** `accept` for `<input type="file">`: MP3 only in v1. */
export const SPEU_MP3_AUDIO_ACCEPT = "audio/mpeg,audio/mp3,audio/x-mp3,.mp3";

/**
 * Client-side guard before upload. Returns Belarusian message or null if the file may be uploaded as MP3.
 */
export function getMp3OnlyAudioRejectionMessage(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "mp3") {
    return "У першай версіі падтрымліваецца толькі MP3. Загрузіце файл з пашырэннем .mp3.";
  }
  const t = file.type?.trim().toLowerCase();
  if (t && t !== "application/octet-stream" && !t.startsWith("text/")) {
    const ok = t === "audio/mpeg" || t === "audio/mp3" || t === "audio/x-mp3";
    if (!ok) {
      return "Файл павінен быць у фармаце MP3. Калі гэта MP3, паспрабуйце іншы браўзер або захавайце файл як MP3.";
    }
  }
  return null;
}

/** Content-Type for Supabase Storage after `getMp3OnlyAudioRejectionMessage` returned null. */
export function mp3AudioUploadContentType(file: File): string {
  const t = file.type?.trim();
  if (t && t !== "application/octet-stream" && !t.startsWith("text/")) {
    if (t === "audio/mp3" || t === "audio/x-mp3" || t === "audio/mpeg") return "audio/mpeg";
  }
  return "audio/mpeg";
}
