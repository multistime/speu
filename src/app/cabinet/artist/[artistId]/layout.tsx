import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { ArtistCabinetSidebar } from "@/components/cabinet/ArtistCabinetSidebar";

export default function ArtistScopedCabinetLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6">
      <ArtistCabinetSidebar />
      <section className="flex-1 min-w-0 space-y-6">
        <Link
          href="/cabinet"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Да асабістага кабінета
        </Link>
        {children}
      </section>
    </div>
  );
}
