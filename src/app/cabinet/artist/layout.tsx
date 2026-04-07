import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ArtistCabinetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/cabinet"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Да асабістага кабінета
        </Link>
        {children}
      </div>
    </div>
  );
}
