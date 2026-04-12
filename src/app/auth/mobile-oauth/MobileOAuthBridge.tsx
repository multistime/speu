"use client";

import { useEffect, useState } from "react";

const PARAM = "app_redirect";

function isAllowedDeepLinkTarget(raw: string): boolean {
  try {
    const u = new URL(raw);
    const scheme = u.protocol.replace(/:$/, "").toLowerCase();
    return scheme === "exp" || scheme === "exps" || scheme === "speu";
  } catch {
    return false;
  }
}

/**
 * Перенос ?code= / ошибок на exp://… або speu://… — інакш iOS не закрывае ASWebAuthenticationSession.
 */
export function MobileOAuthBridge() {
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const search = new URLSearchParams(window.location.search);
    const appRaw = search.get(PARAM);
    const code = search.get("code");
    const error = search.get("error");
    const errorDescription = search.get("error_description");

    if (!appRaw) {
      setNote("no_app_redirect");
      return;
    }

    let target: string;
    try {
      target = decodeURIComponent(appRaw);
    } catch {
      setNote("bad_app_redirect");
      return;
    }

    if (!isAllowedDeepLinkTarget(target)) {
      setNote("forbidden_scheme");
      return;
    }

    try {
      const out = new URL(target);
      if (code) out.searchParams.set("code", code);
      if (error) out.searchParams.set("error", error);
      if (errorDescription) out.searchParams.set("error_description", errorDescription);
      window.location.replace(out.toString());
    } catch {
      try {
        const sep = target.includes("?") ? "&" : "?";
        const extra = new URLSearchParams();
        if (code) extra.set("code", code);
        if (error) extra.set("error", error);
        if (errorDescription) extra.set("error_description", errorDescription);
        const q = extra.toString();
        window.location.replace(q ? `${target}${sep}${q}` : target);
      } catch {
        setNote("bad_target_url");
      }
    }
  }, []);

  if (note === "no_app_redirect") {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center bg-background px-6 text-center text-sm text-muted-foreground">
        <p className="max-w-sm">
          Калі ўваход у дадатку не завяршыўся сам, зачыніце гэта акно. Калі вы ў дадатку Speu — абнавіце
          праграму да апошняй версіі (патрэбны параметр app_redirect у OAuth).
        </p>
      </div>
    );
  }

  if (note) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center bg-background px-6 text-center text-sm text-destructive">
        <p className="max-w-sm">Памылка пераносу ўваходу ў праграму. Зачыніце акно і паспрабуйце яшчэ раз.</p>
      </div>
    );
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-background px-6 text-center text-sm text-muted-foreground">
      <p className="max-w-sm">Вяртанне ў праграму…</p>
    </div>
  );
}
