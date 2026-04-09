import { ArtistProfileEditClient } from "@/components/cabinet/ArtistProfileEditClient";

type Props = { params: Promise<{ artistId: string }> };

export default async function ArtistCabinetProfilePage({ params }: Props) {
  const { artistId } = await params;
  return <ArtistProfileEditClient artistId={artistId} />;
}
