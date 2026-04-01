import type { SupabaseClient } from "@supabase/supabase-js";

export async function writeAdminAuditLog(
  supabase: SupabaseClient,
  actorUserId: string,
  action: string,
  entityType: string,
  entityId: string,
  details: Record<string, unknown> = {}
) {
  const { error } = await supabase.schema("speu").from("admin_audit_log").insert({
    actor_user_id: actorUserId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  });

  // Audit log failures are non-fatal — log to console but don't break the request.
  if (error) {
    console.error("[audit]", error.message);
  }
}
