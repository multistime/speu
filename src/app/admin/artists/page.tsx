import { redirect } from "next/navigation";

export default function AdminArtistsLegacyRedirect() {
  redirect("/admin/label?tab=artists");
}
