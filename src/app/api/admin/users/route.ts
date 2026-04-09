import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import type { AdminUiRoleCode } from "@/lib/admin/user-roles";
import { ADMIN_UI_ROLE_CODES } from "@/lib/admin/user-roles";
import { isSuperadminEmail } from "@/lib/admin/superadmin";
import { createServiceRoleClient } from "@/lib/supabase/service";

const UI_ROLE_SET = new Set<string>(ADMIN_UI_ROLE_CODES);

const STAFF_ADMIN_ROLE_CODES = new Set(["owner", "admin"]);

function roleRowIsActive(expiresAt: string | null | undefined): boolean {
  if (expiresAt == null) return true;
  const t = Date.parse(expiresAt);
  return !Number.isNaN(t) && t > Date.now();
}

/** Matches DB: profiles.is_admin OR active owner/admin in user_roles. */
function computeIsAdmin(
  profileIsAdmin: boolean | undefined,
  activeRoleCodes: string[]
): boolean {
  if (profileIsAdmin) return true;
  return activeRoleCodes.some((c) => STAFF_ADMIN_ROLE_CODES.has(c));
}

/**
 * Ролі ў чэкбоксах UI: listener / artist / admin.
 * owner — службовая, але дае той жа доступ што admin — паказваем «Адмін» уключаным.
 * Калі ў user_roles няма ніводнага радка — у інтэрфейсе як слухач (звычайны карыстальнік).
 */
function deriveProductRoleCodes(roleCodes: string[]): AdminUiRoleCode[] {
  const fromDb = roleCodes.filter((c): c is AdminUiRoleCode => UI_ROLE_SET.has(c));
  const out = new Set(fromDb);
  if (roleCodes.includes("owner") && !out.has("admin")) out.add("admin");
  if (out.size === 0 && roleCodes.length === 0) out.add("listener");
  return [...out];
}

export type AdminUserListItem = {
  id: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  display_name: string | null;
  is_admin: boolean;
  /** Галоўны адмін — ролю «адмін» нельга зняць у інтэрфейсе */
  is_superadmin: boolean;
  /** All assigned role codes from speu.user_roles */
  role_codes: string[];
  /** Subset managed in admin UI */
  product_role_codes: AdminUiRoleCode[];
  /** Label artist cards linked to this user (speu.artists.user_id) */
  linked_artists: { id: string; name: string; slug: string }[];
};

export async function GET(request: Request) {
  const { user } = await requireAdminApi();
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const adminDb = createServiceRoleClient();
  if (!adminDb) {
    return NextResponse.json(
      {
        error: "service_role_missing",
        details:
          "Дадайце SUPABASE_SERVICE_ROLE_KEY у Vercel (Production) — патрэбна для auth.admin.listUsers і чытання speu.*.",
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const rawPer = Number(searchParams.get("perPage")) || 50;
  const perPage = Math.min(Math.max(1, rawPer), 1000);

  const listPage = q ? 1 : page;
  const listPerPage = q ? 1000 : perPage;

  const { data: listData, error: listError } = await adminDb.auth.admin.listUsers({
    page: listPage,
    perPage: listPerPage,
  });
  if (listError) {
    return NextResponse.json({ error: "list_failed", details: listError.message }, { status: 500 });
  }

  let users = listData.users;
  if (q) {
    users = users.filter((u) => {
      const email = (u.email ?? "").toLowerCase();
      const metaName = String(u.user_metadata?.full_name ?? u.user_metadata?.name ?? "").toLowerCase();
      return email.includes(q) || metaName.includes(q) || u.id.toLowerCase().includes(q);
    });
  }

  const ids = users.map((u) => u.id);
  if (ids.length === 0) {
    return NextResponse.json({
      items: [] as AdminUserListItem[],
      total: q ? 0 : (listData.total ?? 0),
      page: q ? 1 : page,
      perPage: q ? users.length : perPage,
      searchActive: Boolean(q),
    });
  }

  const [{ data: profiles }, { data: userRolesRows }, { data: allRoles }] = await Promise.all([
    adminDb.schema("speu").from("profiles").select("id, display_name, is_admin").in("id", ids),
    adminDb.schema("speu").from("user_roles").select("user_id, role_id, expires_at").in("user_id", ids),
    adminDb.schema("speu").from("roles").select("id, code"),
  ]);

  const codeByRoleId = new Map<number, string>();
  for (const r of allRoles ?? []) {
    codeByRoleId.set(Number(r.id), r.code);
  }

  const rolesByUser = new Map<string, string[]>();
  for (const row of userRolesRows ?? []) {
    if (!roleRowIsActive(row.expires_at as string | null | undefined)) continue;
    const code = codeByRoleId.get(Number(row.role_id));
    if (!code) continue;
    const arr = rolesByUser.get(row.user_id) ?? [];
    arr.push(code);
    rolesByUser.set(row.user_id, arr);
  }

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const { data: linkedRows } =
    ids.length > 0
      ? await adminDb
          .schema("speu")
          .from("artists")
          .select("id, name, slug, user_id")
          .in("user_id", ids)
      : { data: [] as { id: string; name: string; slug: string; user_id: string }[] };

  const linkedByUserId = new Map<string, { id: string; name: string; slug: string }[]>();
  for (const a of linkedRows ?? []) {
    const uid = a.user_id as string;
    const arr = linkedByUserId.get(uid) ?? [];
    arr.push({ id: a.id, name: a.name, slug: a.slug });
    linkedByUserId.set(uid, arr);
  }

  const items: AdminUserListItem[] = users.map((u) => {
    const profile = profileById.get(u.id);
    const role_codes = rolesByUser.get(u.id) ?? [];
    const product_role_codes = deriveProductRoleCodes(role_codes);
    return {
      id: u.id,
      email: u.email ?? null,
      phone: u.phone ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      email_confirmed_at: u.email_confirmed_at ?? null,
      display_name: profile?.display_name ?? null,
      is_admin: computeIsAdmin(profile?.is_admin, role_codes),
      is_superadmin: isSuperadminEmail(u.email ?? null),
      role_codes,
      product_role_codes,
      linked_artists: linkedByUserId.get(u.id) ?? [],
    };
  });

  return NextResponse.json({
    items,
    total: q ? items.length : (listData.total ?? items.length),
    page: q ? 1 : page,
    perPage: q ? items.length || perPage : perPage,
    searchActive: Boolean(q),
  });
}
