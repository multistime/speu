import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";

export async function POST(request: Request) {
  const { adminDb, user } = await requireAdminApi();
  if (!user || !adminDb) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form_data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "no_file" }, { status: 400 });

  const maxSize = 52428800; // 50 MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: "file_too_large", maxMb: 50 }, { status: 413 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext !== "mp3") {
    return NextResponse.json({ error: "invalid_extension", expected: "mp3" }, { status: 400 });
  }

  const allowed = ["audio/mpeg", "audio/mp3", "audio/x-mp3"];
  const mime = file.type || "audio/mpeg";
  if (!allowed.includes(mime)) {
    return NextResponse.json({ error: "invalid_mime", mime }, { status: 415 });
  }

  const filename = `songs/${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { data, error } = await adminDb.storage
    .from("speu-audio")
    .upload(filename, buffer, {
      contentType: mime,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: "upload_failed", details: error.message }, { status: 500 });
  }

  const { data: { publicUrl } } = adminDb.storage
    .from("speu-audio")
    .getPublicUrl(data.path);

  return NextResponse.json({ ok: true, url: publicUrl, path: data.path });
}
