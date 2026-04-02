import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repos/audit";

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "in_progress", "done", "rejected"]),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
});

export async function GET() {
  const { adminDb, user } = await requireAdminApi();
  if (!user || !adminDb) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data, error } = await adminDb
    .schema("speu")
    .from("service_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function PATCH(request: Request) {
  const { adminDb, user } = await requireAdminApi();
  if (!user || !adminDb) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const payload = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const { error } = await adminDb
    .schema("speu")
    .from("service_requests")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);
  if (error) return NextResponse.json({ error: "update_failed" }, { status: 500 });

  await writeAdminAuditLog(
    adminDb,
    user.id,
    "service_request.status_update",
    "service_requests",
    parsed.data.id,
    { status: parsed.data.status }
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { adminDb, user } = await requireAdminApi();
  if (!user || !adminDb) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const payload = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const { error } = await adminDb
    .schema("speu")
    .from("service_requests")
    .delete()
    .eq("id", parsed.data.id);
  if (error) return NextResponse.json({ error: "delete_failed" }, { status: 500 });

  await writeAdminAuditLog(adminDb, user.id, "service_request.delete", "service_requests", parsed.data.id, {});

  return NextResponse.json({ ok: true });
}
