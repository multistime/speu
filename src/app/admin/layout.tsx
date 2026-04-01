import type { ReactNode } from "react";
import { requireAdminPage } from "@/lib/auth/admin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPage();

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6">
        <AdminSidebar />
        <section className="flex-1 min-w-0">{children}</section>
      </div>
    </div>
  );
}
