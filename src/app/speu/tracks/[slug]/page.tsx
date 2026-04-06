import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SpeuTrackPageView } from "@/components/speu/SpeuTrackPageView";
import { fetchSpeuTrackBySlugOrId } from "@/lib/speu/catalog.server";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchSpeuTrackBySlugOrId(slug);
  if (!data) return { title: "Трэк — Спеў" };
  return {
    title: `${data.track.title} — Спеў`,
    description: `${data.track.artistLine}${data.track.album ? ` · ${data.track.album.title}` : ""}`,
  };
}

export default async function SpeuTrackPage({ params }: Props) {
  const { slug } = await params;
  const data = await fetchSpeuTrackBySlugOrId(slug);
  if (!data) notFound();
  return <SpeuTrackPageView data={data} />;
}
