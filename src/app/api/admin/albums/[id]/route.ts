import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repos/audit";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await requireAdminApi();
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;

  const { error } = await supabase
    .schema("speu")
    .from("albums")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: "delete_failed", details: error.message }, { status: 500 });

  await writeAdminAuditLog(supabase, user.id, "album.delete", "albums", id, {});
  return NextResponse.json({ ok: true });
}
