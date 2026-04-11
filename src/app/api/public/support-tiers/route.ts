import { NextResponse } from "next/server";
import { createAnonServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createAnonServerClient();
  const { data, error } = await supabase
    .schema("speu")
    .from("support_tiers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}
