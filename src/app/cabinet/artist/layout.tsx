import type { ReactNode } from "react";

/** Сайдбар толькі ў [artistId]/layout — тут агульны адступ для хаба і кабінета. */
export default function ArtistCabinetLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">{children}</div>;
}
