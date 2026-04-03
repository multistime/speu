import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json(null, { status: 401 });

  const { data, error } = await supabase.rpc("get_my_speu_profile");

  if (error) {
    console.error("[api/user/profile]", error.message);
    return NextResponse.json(null, { status: 500 });
  }

  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json(row ?? null, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}
