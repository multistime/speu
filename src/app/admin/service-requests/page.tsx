import { redirect } from "next/navigation";

export default function AdminServiceRequestsLegacyRedirect() {
  redirect("/admin/site/service-requests");
}
