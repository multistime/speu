import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Уваход у праграму",
  robots: { index: false, follow: false },
};

/**
 * Supabase OAuth redirect для мабільнага кліента (PKCE): тут апынуцца з ?code= пасля Google.
 * Сесію ў AsyncStorage устанаўлівае дадатак праз exchangeCodeForSession(code); openAuthSessionAsync
 * зачыняецца на гэтым URL.
 */
export default function MobileOAuthCallbackPage() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-background px-6 text-center text-sm text-muted-foreground">
      <p className="max-w-sm">
        Калі ўваход у дадатку не завяршыўся сам, зачыніце гэта акно — сесія перадаецца ў праграму Speu.
      </p>
    </div>
  );
}
