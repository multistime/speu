import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUiAccentPresetId } from "@/lib/speu/ui-accent";

export const dynamic = "force-dynamic";

const REPEAT = new Set(["off", "all", "one"]);

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const updates: Record<string, string | boolean> = {};

  if (
    typeof o.player_queue_repeat_mode === "string" &&
    REPEAT.has(o.player_queue_repeat_mode)
  ) {
    updates.player_queue_repeat_mode = o.player_queue_repeat_mode;
  }
  if (typeof o.player_queue_shuffle === "boolean") {
    updates.player_queue_shuffle = o.player_queue_shuffle;
  }
  if (typeof o.player_single_repeat === "boolean") {
    updates.player_single_repeat = o.player_single_repeat;
  }
  if (
    typeof o.ui_accent_preset_id === "string" &&
    isUiAccentPresetId(o.ui_accent_preset_id)
  ) {
    updates.ui_accent_preset_id = o.ui_accent_preset_id;
  }
  if (typeof o.admin_show_all_pages === "boolean") {
    const { data: profRows, error: profErr } = await supabase.rpc("get_my_speu_profile");
    if (profErr) {
      return NextResponse.json({ error: "Profile check failed" }, { status: 500 });
    }
    const prof = Array.isArray(profRows) ? profRows[0] : profRows;
    const isAdmin =
      prof &&
      typeof prof === "object" &&
      "is_admin" in prof &&
      Boolean((prof as { is_admin?: boolean }).is_admin);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    updates.admin_show_all_pages = o.admin_show_all_pages;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { error } = await supabase
    .schema("speu")
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    console.error("[api/user/player-prefs]", error.message);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
