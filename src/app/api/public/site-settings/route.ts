import { NextResponse } from "next/server";
import { createAnonServerClient } from "@/lib/supabase/server";

// Keys that are safe to expose publicly (must match site_settings RLS policy)
const PUBLIC_KEY_PREFIXES = ["radio_", "artists_", "support_", "speu_"];

function isPublicKey(key: string): boolean {
  if (key === "footer_config") return true;
  return PUBLIC_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key && !isPublicKey(key)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const supabase = createAnonServerClient();

  let query = supabase.schema("speu").from("site_settings").select("key, value");

  if (key) {
    query = query.eq("key", key);
  } else {
    // Only return keys matching public prefixes
    query = query.or(
      [...PUBLIC_KEY_PREFIXES.map((p) => `key.like.${p}%`), "key.eq.footer_config"].join(","),
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ settings: {} });
  }

  const settings: Record<string, string> = {};
  (data ?? []).forEach((row) => {
    settings[row.key] = row.value ?? "";
  });

  return NextResponse.json({ settings });
}
