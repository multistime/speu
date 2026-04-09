import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArtistCabinetArtistPicker, type PickerArtist } from "@/components/cabinet/ArtistCabinetArtistPicker";

export const dynamic = "force-dynamic";

function parseLinkedArtists(raw: unknown): PickerArtist[] {
  if (!Array.isArray(raw)) return [];
  const out: PickerArtist[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id : "";
    if (!id) continue;
    out.push({
      id,
      name: typeof o.name === "string" ? o.name : "",
      slug: typeof o.slug === "string" ? o.slug : "",
    });
  }
  return out;
}

export default async function ArtistCabinetHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/cabinet");

  const { data, error } = await supabase.rpc("get_my_speu_profile");
  if (error || data == null) {
    return (
      <div className="max-w-lg mx-auto glass rounded-2xl border border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">Не ўдалося загрузіць профіль.</p>
        <Link href="/cabinet" className="inline-block mt-4 text-sm text-primary hover:underline">
          Назад у кабінет
        </Link>
      </div>
    );
  }

  const row = Array.isArray(data) ? data[0] : data;
  const linked = parseLinkedArtists(row?.linked_artists);

  if (!row?.is_artist || linked.length === 0) {
    return (
      <div className="max-w-lg mx-auto glass rounded-2xl border border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Кабінет артыста даступны пасля прывязкі вашага акаўнта да картачкі артыста на лэйбле.
        </p>
        <Link href="/cabinet" className="inline-block mt-4 text-sm text-primary hover:underline">
          Вярнуцца ў кабінет
        </Link>
      </div>
    );
  }

  if (linked.length === 1) {
    redirect(`/cabinet/artist/${linked[0].id}/analytics`);
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link
        href="/cabinet"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Да асабістага кабінета
      </Link>
      <ArtistCabinetArtistPicker artists={linked} />
    </div>
  );
}
