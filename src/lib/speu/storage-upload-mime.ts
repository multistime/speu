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

export function audioUploadContentType(file: File): string {
  const t = file.type?.trim();
  if (t && t !== "application/octet-stream" && !t.startsWith("text/")) {
    if (t === "audio/wave" || t === "audio/x-ms-wav") return "audio/wav";
    return t;
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "wav":
      return "audio/wav";
    case "mp3":
    case "mpeg":
      return "audio/mpeg";
    case "ogg":
    case "oga":
      return "audio/ogg";
    default:
      return "audio/mpeg";
  }
}
