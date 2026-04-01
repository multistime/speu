import type { SupabaseClient } from "@supabase/supabase-js";

type ContentPage = {
  id: number;
  slug: string;
  title: string;
  status: "draft" | "published" | "archived";
};

type ContentBlock = {
  id: number;
  page_id: number;
  block_key: string;
  block_type: string;
  order_index: number;
  enabled: boolean;
  payload_json: Record<string, unknown>;
};

export async function listContentPages(supabase: SupabaseClient): Promise<ContentPage[]> {
  const { data, error } = await supabase
    .schema("speu")
    .from("content_pages")
    .select("id, slug, title, status")
    .order("slug", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listBlocksByPageSlug(
  supabase: SupabaseClient,
  slug: string
): Promise<ContentBlock[]> {
  const { data, error } = await supabase
    .schema("speu")
    .from("content_pages")
    .select("id, content_blocks(id, page_id, block_key, block_type, order_index, enabled, payload_json)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data?.content_blocks as ContentBlock[] | null) ?? [];
}
