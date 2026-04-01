import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repos/audit";

const tierSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1),
  name: z.string().min(1),
  labelBe: z.string().optional(),
  description: z.string().optional(),
  priceAmount: z.number().nonnegative(),
  currency: z.string().default("USD"),
  period: z.string().default("/мес"),
  perks: z.array(z.string()).default([]),
  highlighted: z.boolean().default(false),
  accentColor: z.string().optional(),
  glowRgb: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  const { supabase, user } = await requireAdminApi();
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .schema("speu")
    .from("support_tiers")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: "fetch_failed", details: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireAdminApi();
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const payload = await request.json().catch(() => null);
  const parsed = tierSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });

  const row = {
    code: parsed.data.code,
    name: parsed.data.name,
    label_be: parsed.data.labelBe ?? null,
    description: parsed.data.description ?? null,
    price_amount: parsed.data.priceAmount,
    currency: parsed.data.currency,
    period: parsed.data.period,
    perks: parsed.data.perks,
    highlighted: parsed.data.highlighted,
    accent_color: parsed.data.accentColor ?? null,
    glow_rgb: parsed.data.glowRgb ?? null,
    is_active: parsed.data.isActive,
    sort_order: parsed.data.sortOrder,
    updated_by: user.id,
  };

  // Update existing tier by id
  if (parsed.data.id) {
    const { data, error } = await supabase
      .schema("speu")
      .from("support_tiers")
      .update(row)
      .eq("id", parsed.data.id)
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: "save_failed", details: error.message }, { status: 500 });
    await writeAdminAuditLog(supabase, user.id, "support_tier.update", "support_tiers", data.id, { code: parsed.data.code });
    return NextResponse.json({ ok: true, id: data.id });
  }

  // Insert new tier; on duplicate code — update (handles seed data)
  const { data, error } = await supabase
    .schema("speu")
    .from("support_tiers")
    .upsert({ ...row }, { onConflict: "code" })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: "save_failed", details: error.message }, { status: 500 });

  await writeAdminAuditLog(supabase, user.id, "support_tier.upsert", "support_tiers", data.id, { code: parsed.data.code });
  return NextResponse.json({ ok: true, id: data.id });
}
