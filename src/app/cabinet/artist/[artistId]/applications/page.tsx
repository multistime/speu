import ArtistApplicationsPageClient from "./ArtistApplicationsPageClient";

type Props = { params: Promise<{ artistId: string }> };

export default async function ArtistApplicationsPage({ params }: Props) {
  const { artistId } = await params;
  return <ArtistApplicationsPageClient artistId={artistId} />;
}
