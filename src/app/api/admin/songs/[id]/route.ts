import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repos/audit";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { adminDb, user } = await requireAdminApi();
  if (!user || !adminDb) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;

  const { error } = await adminDb
    .schema("speu")
    .from("artist_tracks")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: "delete_failed", details: error.message }, { status: 500 });

  await writeAdminAuditLog(adminDb, user.id, "song.delete", "artist_tracks", id, {});
  return NextResponse.json({ ok: true });
}
