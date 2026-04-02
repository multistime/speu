import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repos/audit";

const upsertSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

const batchSchema = z.array(upsertSchema);

export async function GET() {
  const { adminDb, user } = await requireAdminApi();
  if (!user || !adminDb) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data, error } = await adminDb
    .schema("speu")
    .from("site_settings")
    .select("key, value, description, updated_at")
    .order("key", { ascending: true });

  if (error) return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

// Accepts either a single { key, value } or an array of them
export async function POST(request: Request) {
  const { adminDb, user } = await requireAdminApi();
  if (!user || !adminDb) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const payload = await request.json().catch(() => null);
  if (!payload) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const rows = Array.isArray(payload) ? payload : [payload];
  const parsed = batchSchema.safeParse(rows);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });

  for (const row of parsed.data) {
    const { error } = await adminDb
      .schema("speu")
      .from("site_settings")
      .upsert({ key: row.key, value: row.value, updated_by: user.id, updated_at: new Date().toISOString() });

    if (error) return NextResponse.json({ error: "save_failed", key: row.key, details: error.message }, { status: 500 });
  }

  await writeAdminAuditLog(adminDb, user.id, "settings.update", "site_settings", "batch", {
    keys: parsed.data.map((r) => r.key),
  });

  return NextResponse.json({ ok: true });
}
