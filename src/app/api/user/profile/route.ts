import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json(null, { status: 401 });

  const { data, error } = await supabase
    .schema("speu")
    .from("profiles")
    .select("id, display_name, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json(null, { status: 500 });
  return NextResponse.json(data);
}
