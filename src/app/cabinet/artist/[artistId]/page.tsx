import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ artistId: string }> };

/**
 * /cabinet/artist/:uuid — сумяшчальнасць са старымі спасылкамі:
 * спачатку як id заяўкі → рэдырэкт на .../submission/:id;
 * інакш як id картачкі артыста → рэдырэкт на .../analytics.
 */
export default async function ArtistCabinetLegacyOrRootPage({ params }: Props) {
  const { artistId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/cabinet");

  const { data: sub } = await supabase
    .schema("speu")
    .from("release_submissions")
    .select("id, artist_id, user_id")
    .eq("id", artistId)
    .maybeSingle();

  if (sub && sub.user_id === user.id) {
    redirect(`/cabinet/artist/${sub.artist_id}/submission/${sub.id}`);
  }

  const { data: owned } = await supabase
    .schema("speu")
    .from("artists")
    .select("id")
    .eq("id", artistId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (owned) {
    redirect(`/cabinet/artist/${artistId}/analytics`);
  }

  notFound();
}
