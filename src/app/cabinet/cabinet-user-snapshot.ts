import type { User as SupabaseUser } from "@supabase/supabase-js";

/** Мінімум палёў для SSR → кліент (адлюстраванне профілю ў кабінеце). */
export type CabinetUserSnapshot = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

export function toCabinetUserSnapshot(user: {
  id: string;
  email?: string | null;
  user_metadata?: SupabaseUser["user_metadata"];
}): CabinetUserSnapshot {
  return {
    id: user.id,
    email: user.email ?? undefined,
    user_metadata: user.user_metadata as Record<string, unknown> | undefined,
  };
}

/** Дастаткова для JSX кабінета; поўны Session user прыйдзе з onAuthStateChange пры неабходнасці. */
export function snapshotToDisplayUser(snapshot: CabinetUserSnapshot): SupabaseUser {
  return {
    id: snapshot.id,
    email: snapshot.email ?? "",
    user_metadata: snapshot.user_metadata ?? {},
    app_metadata: {},
    aud: "authenticated",
    created_at: "",
  } as SupabaseUser;
}
