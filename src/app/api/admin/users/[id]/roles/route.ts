import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repos/audit";
import { ADMIN_UI_ROLE_CODES, type AdminUiRoleCode } from "@/lib/admin/user-roles";

const uiRoleEnum = z.enum(ADMIN_UI_ROLE_CODES);

const patchSchema = z
  .object({
    codes: z.array(uiRoleEnum),
    /** Required when `artist` is in codes: label artist card (speu.artists.id) to bind 1:1 */
    linkedArtistId: z.string().uuid().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.codes.includes("artist") && !data.linkedArtistId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Пры ролі «артыст» абярыце карточку артыста лэйбла",
        path: ["linkedArtistId"],
      });
    }
  });

const MANAGED_CODES = new Set<string>(ADMIN_UI_ROLE_CODES);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { adminDb, user } = await requireAdminApi();
  if (!user || !adminDb) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id: targetId } = await params;
  if (!z.string().uuid().safeParse(targetId).success) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const codes = [...new Set(parsed.data.codes)] as AdminUiRoleCode[];

  const { data: roleRows, error: rolesError } = await adminDb
    .schema("speu")
    .from("roles")
    .select("id, code")
    .in("code", [...MANAGED_CODES]);

  if (rolesError || !roleRows?.length) {
    return NextResponse.json({ error: "roles_lookup_failed", details: rolesError?.message }, { status: 500 });
  }

  const idByCode = new Map(roleRows.map((r) => [r.code, Number(r.id)]));
  for (const c of MANAGED_CODES) {
    if (!idByCode.has(c)) {
      return NextResponse.json(
        { error: "missing_role_in_db", code: c, hint: "Apply migrations (listener, artist, admin)" },
        { status: 500 }
      );
    }
  }

  const { data: currentUr } = await adminDb
    .schema("speu")
    .from("user_roles")
    .select("role_id")
    .eq("user_id", targetId);

  const { data: allRoles } = await adminDb.schema("speu").from("roles").select("id, code");
  const codeById = new Map((allRoles ?? []).map((r) => [Number(r.id), r.code]));
  const hadAdminRole = (currentUr ?? []).some((row) => codeById.get(Number(row.role_id)) === "admin");

  if (targetId === user.id && hadAdminRole && !codes.includes("admin")) {
    return NextResponse.json(
      { error: "cannot_strip_own_admin", message: "Нельга зняць з сябе ролю адміністратара" },
      { status: 400 }
    );
  }

  const managedIds = [...MANAGED_CODES].map((c) => idByCode.get(c)!).filter(Boolean);

  const { error: delError } = await adminDb
    .schema("speu")
    .from("user_roles")
    .delete()
    .eq("user_id", targetId)
    .in("role_id", managedIds);

  if (delError) {
    return NextResponse.json({ error: "update_failed", details: delError.message }, { status: 500 });
  }

  if (codes.length > 0) {
    const inserts = codes.map((code) => ({
      user_id: targetId,
      role_id: idByCode.get(code)!,
      granted_by: user.id,
    }));

    const { error: insError } = await adminDb.schema("speu").from("user_roles").insert(inserts);
    if (insError) {
      return NextResponse.json({ error: "update_failed", details: insError.message }, { status: 500 });
    }
  }

  const { error: clearLinkErr } = await adminDb
    .schema("speu")
    .from("artists")
    .update({ user_id: null })
    .eq("user_id", targetId);
  if (clearLinkErr) {
    return NextResponse.json({ error: "update_failed", details: clearLinkErr.message }, { status: 500 });
  }

  if (codes.includes("artist") && parsed.data.linkedArtistId) {
    const aid = parsed.data.linkedArtistId;
    const { data: prev, error: prevErr } = await adminDb
      .schema("speu")
      .from("artists")
      .select("id, user_id")
      .eq("id", aid)
      .maybeSingle();
    if (prevErr || !prev) {
      return NextResponse.json({ error: "artist_not_found" }, { status: 400 });
    }
    const other = prev.user_id as string | null;
    if (other && other !== targetId) {
      return NextResponse.json(
        {
          error: "artist_already_linked",
          message: "Гэтая карточка артыста ўжо прывязана да іншага карыстальніка",
        },
        { status: 409 }
      );
    }
    const { error: linkErr } = await adminDb
      .schema("speu")
      .from("artists")
      .update({ user_id: targetId })
      .eq("id", aid);
    if (linkErr) {
      return NextResponse.json({ error: "update_failed", details: linkErr.message }, { status: 500 });
    }
  }

  await writeAdminAuditLog(adminDb, user.id, "user.roles_set", "auth.users", targetId, {
    codes,
    linkedArtistId: parsed.data.linkedArtistId ?? null,
  });

  return NextResponse.json({ ok: true, codes });
}
