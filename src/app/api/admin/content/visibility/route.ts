import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repos/audit";

const bodySchema = z.object({
  slug: z.string().min(1),
  visibleOnSite: z.boolean(),
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

  const { slug, visibleOnSite } = parsed.data;
  if (slug === "home") {
    return NextResponse.json({ error: "home_cannot_be_hidden" }, { status: 400 });
  }

  const { data: page, error: fetchErr } = await adminDb
    .schema("speu")
    .from("content_pages")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (fetchErr || !page) {
    return NextResponse.json({ error: "page_not_found" }, { status: 404 });
  }

  const { error } = await adminDb
    .schema("speu")
    .from("content_pages")
    .update({ visible_on_site: visibleOnSite, updated_by: user.id })
    .eq("slug", slug);
  if (error) {
    return NextResponse.json(
      { error: "update_failed", details: error.message },
      { status: 500 }
    );
  }

  await writeAdminAuditLog(adminDb, user.id, "content_page.visibility", "content_pages", String(page.id), {
    slug,
    visibleOnSite,
  });

  revalidatePath("/", "layout");
  revalidatePath(`/${slug}`);

  return NextResponse.json({ ok: true });
}
