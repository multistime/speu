import { redirect } from "next/navigation";

export default function AdminContentLegacyRedirect() {
  redirect("/admin/site/content");
}
