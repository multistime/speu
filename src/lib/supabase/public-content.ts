import { createClient } from "@/lib/supabase/server";

type Block = {
  block_key: string;
  payload_json: Record<string, unknown>;
};

export async function getPageBlocks(slug: string): Promise<Block[]> {
  const supabase = await createClient();
  const { data: page } = await supabase
    .schema("speu")
    .from("content_pages")
    .select("id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!page) return [];

  const { data } = await supabase
    .schema("speu")
    .from("content_blocks")
    .select("block_key, payload_json")
    .eq("page_id", page.id)
    .eq("enabled", true)
    .order("order_index", { ascending: true });
  return (data ?? []) as Block[];
}

export function blockPayload<T extends Record<string, unknown>>(
  blocks: Block[],
  key: string,
  fallback: T
): T {
  const found = blocks.find((block) => block.block_key === key)?.payload_json;
  if (!found) return fallback;
  return { ...fallback, ...found } as T;
}
