import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repos/audit";

const bodySchema = z.object({
  slug: z.string().min(1),
});

export async function POST(request: Request) {
  const { adminDb, user } = await requireAdminApi();
  if (!user || !adminDb) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { slug } = parsed.data;

  const { data: target, error: fetchErr } = await adminDb
    .schema("speu")
    .from("content_pages")
    .select("id, slug, status")
    .eq("slug", slug)
    .maybeSingle();

  if (fetchErr || !target) {
    return NextResponse.json({ error: "page_not_found" }, { status: 404 });
  }
  if (target.status !== "published") {
    return NextResponse.json({ error: "page_must_be_published" }, { status: 400 });
  }

  const { error: clearErr } = await adminDb
    .schema("speu")
    .from("content_pages")
    .update({ is_home: false })
    .neq("slug", "");

  if (clearErr) {
    return NextResponse.json(
      { error: "update_failed", details: clearErr.message },
      { status: 500 }
    );
  }

  const { error: setErr } = await adminDb
    .schema("speu")
    .from("content_pages")
    .update({
      is_home: true,
      visible_on_site: true,
      updated_by: user.id,
    })
    .eq("slug", slug);

  if (setErr) {
    return NextResponse.json(
      { error: "update_failed", details: setErr.message },
      { status: 500 }
    );
  }

  await writeAdminAuditLog(adminDb, user.id, "content_page.home", "content_pages", String(target.id), {
    slug,
  });

  revalidatePath("/", "layout");
  revalidatePath(`/${slug}`);

  return NextResponse.json({ ok: true });
}
