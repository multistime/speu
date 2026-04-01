import type { SupabaseClient } from "@supabase/supabase-js";

export type SupportTierRecord = {
  id: string;
  code: string;
  name: string;
  label_be: string | null;
  description: string | null;
  price_amount: number;
  currency: string;
  period: string;
  perks: string[];
  highlighted: boolean;
  accent_color: string | null;
  glow_rgb: string | null;
  is_active: boolean;
  sort_order: number;
};

export async function listSupportTiers(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .schema("speu")
    .from("support_tiers")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SupportTierRecord[];
}
