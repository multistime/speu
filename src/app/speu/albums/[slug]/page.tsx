import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SpeuAlbumPageView } from "@/components/speu/SpeuAlbumPageView";
import { fetchSpeuAlbumBySlugOrId } from "@/lib/speu/catalog.server";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchSpeuAlbumBySlugOrId(slug);
  if (!data) return { title: "Альбом — Спеў" };
  return {
    title: `${data.title} — Спеў`,
    description: `Альбом ${data.title} · ${data.artists.map((a) => a.name).join(", ")}`,
  };
}

export default async function SpeuAlbumPage({ params }: Props) {
  const { slug } = await params;
  const data = await fetchSpeuAlbumBySlugOrId(slug);
  if (!data) notFound();
  return <SpeuAlbumPageView data={data} />;
}
