import { redirect } from "next/navigation";

export default function AdminSongsLegacyRedirect() {
  redirect("/admin/label");
}
