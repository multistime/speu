import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ authenticated: false, auth_error: authError?.message });
  }

  const { data: profileDirect, error: directError } = await supabase
    .schema("speu")
    .from("profiles")
    .select("id, display_name, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  const { data: profileRpc, error: rpcError } = await supabase
    .rpc("get_speu_profile", { _user_id: user.id });

  return NextResponse.json({
    authenticated: true,
    user_id: user.id,
    user_email: user.email,
    direct_query: { data: profileDirect, error: directError?.message ?? null },
    rpc_query: { data: profileRpc, error: rpcError?.message ?? null },
  });
}
