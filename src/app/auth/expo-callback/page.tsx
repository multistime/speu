import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Вяртанне ў праграму",
  robots: { index: false, follow: false },
};

/**
 * Landing пасля Google OAuth для мабільнага дадатку (Expo).
 * Сесію устанаўлівае кліент праз exchangeCodeForSession(callbackUrl); гэтая старонка толькі для карыстальніка.
 */
export default function ExpoAuthCallbackPage() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-background px-6 text-center text-sm text-muted-foreground">
      <p className="max-w-sm">
        Калі ўваход у дадатку не завяршыўся сам, зачыніце гэта акно — сесія перадаецца ў праграму Speu.
      </p>
    </div>
  );
}
