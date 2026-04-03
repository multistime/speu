import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repos/audit";

const createBlockSchema = z.object({
  pageSlug: z.string().min(1),
  blockKey: z.string().min(1),
  blockType: z.string().min(1),
  orderIndex: z.number().int().default(0),
  enabled: z.boolean().default(true),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export async function GET() {
  const { adminDb, user } = await requireAdminApi();
  if (!user || !adminDb) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: pages, error: pagesError } = await adminDb
    .schema("speu")
    .from("content_pages")
    .select("id, slug, title, status, visible_on_site")
    .order("slug", { ascending: true });

  if (pagesError) {
    return NextResponse.json(
      { error: "fetch_failed", details: pagesError.message },
      { status: 500 }
    );
  }

  const pageList = pages ?? [];
  const pageIds = pageList.map((p) => p.id);
  const { data: blockRows, error: blocksError } =
    pageIds.length > 0
      ? await adminDb
          .schema("speu")
          .from("content_blocks")
          .select("id, page_id, block_key, block_type, order_index, enabled, payload_json")
          .in("page_id", pageIds)
          .order("page_id", { ascending: true })
          .order("order_index", { ascending: true })
      : { data: [] as Record<string, unknown>[], error: null };

  if (blocksError) {
    return NextResponse.json(
      { error: "fetch_failed", details: blocksError.message },
      { status: 500 }
    );
  }

  const blocksByPage = new Map<number, unknown[]>();
  for (const row of blockRows ?? []) {
    const pid = row.page_id as number;
    const list = blocksByPage.get(pid) ?? [];
    const { page_id: _p, ...rest } = row as Record<string, unknown>;
    list.push(rest);
    blocksByPage.set(pid, list);
  }

  const items = pageList.map((p) => ({
    ...p,
    content_blocks: blocksByPage.get(p.id) ?? [],
  }));

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const { adminDb, user } = await requireAdminApi();
  if (!user || !adminDb) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = createBlockSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { data: page, error: pageError } = await adminDb
    .schema("speu")
    .from("content_pages")
    .select("id")
    .eq("slug", parsed.data.pageSlug)
    .maybeSingle();
  if (pageError || !page) {
    return NextResponse.json({ error: "page_not_found" }, { status: 404 });
  }

  const { data: inserted, error } = await adminDb
    .schema("speu")
    .from("content_blocks")
    .upsert(
      {
        page_id: page.id,
        block_key: parsed.data.blockKey,
        block_type: parsed.data.blockType,
        order_index: parsed.data.orderIndex,
        enabled: parsed.data.enabled,
        payload_json: parsed.data.payload,
        updated_by: user.id,
      },
      { onConflict: "page_id,block_key" }
    )
    .select("id")
    .single();
  if (error) {
    return NextResponse.json({ error: "save_failed", details: error.message }, { status: 500 });
  }

  await writeAdminAuditLog(adminDb, user.id, "content_block.upsert", "content_blocks", String(inserted.id), {
    pageSlug: parsed.data.pageSlug,
    blockKey: parsed.data.blockKey,
  });

  return NextResponse.json({ ok: true, id: inserted.id });
}
