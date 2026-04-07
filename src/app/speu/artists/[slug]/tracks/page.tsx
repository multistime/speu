import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SpeuArtistTracksListView } from "@/components/speu/SpeuArtistTracksListView";
import { fetchSpeuArtistBySlug } from "@/lib/speu/catalog.server";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { view } = await searchParams;
  const data = await fetchSpeuArtistBySlug(slug);
  if (!data) return { title: "Трэкі — Спеў" };
  const singles = view === "singles";
  return {
    title: singles ? `Сінглы — ${data.name} — Спеў` : `Усе трэкі — ${data.name} — Спеў`,
  };
}

export default async function SpeuArtistTracksPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { view } = await searchParams;
  const data = await fetchSpeuArtistBySlug(slug);
  if (!data) notFound();
  return <SpeuArtistTracksListView data={data} singlesOnly={view === "singles"} />;
}
