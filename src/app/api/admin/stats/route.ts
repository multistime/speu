import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";

export async function GET() {
  const { adminDb, user } = await requireAdminApi();
  if (!user || !adminDb) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const [artists, pages, tiers, requests] = await Promise.all([
    adminDb.schema("speu").from("artists").select("status", { count: "exact", head: false }),
    adminDb.schema("speu").from("content_pages").select("id", { count: "exact", head: true }),
    adminDb.schema("speu").from("support_tiers").select("is_active", { count: "exact", head: false }),
    adminDb.schema("speu").from("service_requests").select("status", { count: "exact", head: false }),
  ]);

  const artistsPublished = (artists.data ?? []).filter((a) => a.status === "published").length;
  const artistsTotal = artists.count ?? 0;
  const tiersActive = (tiers.data ?? []).filter((t) => t.is_active).length;
  const requestsNew = (requests.data ?? []).filter((r) => r.status === "new").length;
  const pagesTotal = pages.count ?? 0;

  return NextResponse.json({
    artists_total: artistsTotal,
    artists_published: artistsPublished,
    tiers_active: tiersActive,
    requests_new: requestsNew,
    pages_total: pagesTotal,
  });
}
