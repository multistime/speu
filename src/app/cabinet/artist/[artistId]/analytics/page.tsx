import { ArtistAnalyticsClient } from "@/components/cabinet/ArtistAnalyticsClient";

type Props = { params: Promise<{ artistId: string }> };

export default async function ArtistAnalyticsPage({ params }: Props) {
  const { artistId } = await params;
  return <ArtistAnalyticsClient artistId={artistId} />;
}
