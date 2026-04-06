import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SpeuArtistPageView } from "@/components/speu/SpeuArtistPageView";
import { fetchSpeuArtistBySlug } from "@/lib/speu/catalog.server";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchSpeuArtistBySlug(slug);
  if (!data) return { title: "Артыст — Спеў" };
  return {
    title: `${data.name} — Спеў`,
    description: data.tagline || data.bio?.slice(0, 160) || undefined,
  };
}

export default async function SpeuArtistPage({ params }: Props) {
  const { slug } = await params;
  const data = await fetchSpeuArtistBySlug(slug);
  if (!data) notFound();
  return <SpeuArtistPageView data={data} />;
}
