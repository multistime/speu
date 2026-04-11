import type { Metadata } from "next";

/** Публічны каталог /speu з БД — не кэшаваць сегмент як статычны */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Спеў — струмень",
  description:
    "Слухайце каталог беларускага лейбла Спеў: трэкі, альбомы і артысты ў адным месцы.",
};

export default function SpeuLayout({ children }: { children: React.ReactNode }) {
  return children;
}
