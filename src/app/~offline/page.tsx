import Link from "next/link";

export const metadata = {
  title: "Афлайн — Спеў",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-6 py-28 text-center">
      <p className="font-display text-2xl font-semibold text-foreground italic mb-2">
        Няма злучэння
      </p>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Праверце інтэрнэт і паспрабуйце аднавіць старонку. Частку інтэрфейсу можна калісьці загрузіць
        падчас апошняга наведвання.
      </p>
      <Link
        href="/speu"
        className="text-sm px-5 py-2.5 rounded-xl border border-primary/35 text-primary font-medium hover:bg-primary/10 transition-colors"
      >
        Перайсці да Спева
      </Link>
    </div>
  );
}
