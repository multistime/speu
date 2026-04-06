import type { SupabaseClient } from "@supabase/supabase-js";

export const SPEU_IMAGES_BUCKET = "speu-images" as const;

/** 5 MB — адпаведна абмежаванню ў storage.buckets */
export const ADMIN_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const ADMIN_IMAGE_ACCEPT =
  "image/jpeg,image/jpg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif";

const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/pjpeg",
  "image/x-png",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/x-png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function extFromName(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return ext === "jpeg" ? "jpg" : ext;
  return null;
}

function guessMimeFromExt(ext: string): string | null {
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  };
  return map[ext] ?? null;
}

export function validateAdminImageFile(file: File): { ok: true; mime: string } | { ok: false; message: string } {
  if (file.size > ADMIN_IMAGE_MAX_BYTES) {
    return {
      ok: false,
      message: `Файл больш за ${ADMIN_IMAGE_MAX_BYTES / 1024 / 1024} МБ. Сцісніце выяву або абярыце іншы файл.`,
    };
  }

  let mime = (file.type || "").toLowerCase().trim();
  if (!mime || mime === "application/octet-stream") {
    const ext = extFromName(file.name);
    if (ext) {
      const g = guessMimeFromExt(ext);
      if (g) mime = g;
    }
  }

  if (!ALLOWED_MIMES.has(mime)) {
    return {
      ok: false,
      message: "Патрэбны адзін з фарматаў: JPEG, PNG, WebP або GIF.",
    };
  }

  return { ok: true, mime };
}

export function buildImageStoragePath(folder: string, mime: string): string {
  const ext = EXT_BY_MIME[mime] ?? "jpg";
  const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "").replace(/^\/+|\/+$/g, "") || "misc";
  return `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
}

export async function uploadAdminImageFile(
  supabase: SupabaseClient,
  file: File,
  folder: string
): Promise<{ ok: true; publicUrl: string } | { ok: false; message: string }> {
  const v = validateAdminImageFile(file);
  if (!v.ok) return v;

  const path = buildImageStoragePath(folder, v.mime);
  const { data, error } = await supabase.storage.from(SPEU_IMAGES_BUCKET).upload(path, file, {
    contentType: v.mime,
    upsert: false,
  });

  if (error) {
    return { ok: false, message: `Памылка загрузкі: ${error.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(SPEU_IMAGES_BUCKET).getPublicUrl(data.path);
  return { ok: true, publicUrl };
}

export function isLikelyImageUrl(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
