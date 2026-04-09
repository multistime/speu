"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LabelLegacyRedirectInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "albums") router.replace("/admin/label/albums");
    else if (tab === "artists") router.replace("/admin/label/artists");
    else if (tab === "songs") router.replace("/admin/label/songs");
    else router.replace("/admin/label/overview");
  }, [router, searchParams]);

  return <p className="text-sm text-muted-foreground p-6">Загружаецца…</p>;
}

export default function AdminLabelLegacyRedirect() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground p-6">Загружаецца…</p>}>
      <LabelLegacyRedirectInner />
    </Suspense>
  );
}
