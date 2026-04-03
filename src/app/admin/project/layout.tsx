import type { ReactNode } from "react";
import { headers } from "next/headers";
import { ProjectHubHeader } from "@/components/admin/ProjectHubHeader";
import { getProjectHubLinks } from "@/lib/project-hub-links";

export default async function AdminProjectLayout({ children }: { children: ReactNode }) {
  const hubLinks = getProjectHubLinks();
  const h = await headers();
  const requestHost =
    h.get("x-forwarded-host")?.split(",")[0]?.trim() ?? h.get("host") ?? null;

  return (
    <div className="space-y-8">
      <ProjectHubHeader hubLinks={hubLinks} requestHost={requestHost} />
      {children}
    </div>
  );
}
