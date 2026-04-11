import { NextResponse } from "next/server";
import { createAnonServerClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const supabase = createAnonServerClient();

  const { data: page, error: pageError } = await supabase
    .schema("speu")
    .from("content_pages")
    .select("id, slug, title, status")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (pageError || !page) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: blocks, error } = await supabase
    .schema("speu")
    .from("content_blocks")
    .select("id, block_key, block_type, order_index, enabled, payload_json")
    .eq("page_id", page.id)
    .eq("enabled", true)
    .order("order_index", { ascending: true });
  if (error) {
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }

  return NextResponse.json({ page, blocks: blocks ?? [] });
}
