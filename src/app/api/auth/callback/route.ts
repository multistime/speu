import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/cabinet";

  // OAuth error returned from provider
  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");

  if (error ?? errorCode) {
    const params = new URLSearchParams({ error: error ?? errorCode ?? "unknown" });
    if (errorDescription) params.set("error_description", errorDescription);
    return NextResponse.redirect(`${origin}/cabinet?${params.toString()}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    const params = new URLSearchParams({ error: "auth_callback_error" });
    if (exchangeError.message) params.set("error_description", exchangeError.message);
    return NextResponse.redirect(`${origin}/cabinet?${params.toString()}`);
  }

  return NextResponse.redirect(`${origin}/cabinet?error=auth_callback_error&error_description=Missing+authorization+code`);
}
