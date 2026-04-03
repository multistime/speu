import { LyricsGenerator } from "@/components/LyricsGenerator";

export const metadata = {
  title: "Генератар Спеў",
  description:
    "Генератар Спеў — інструмент для напісання тэкстаў песень на беларускай мове. Выберыце жанр, настроенне і тэму.",
};

export default function GeneratorPage() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/22 bg-primary/6 mb-6">
            {/* Vasіlok (cornflower) icon */}
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
              <circle cx="5.5" cy="5.5" r="1.3" fill="currentColor" className="text-primary" />
              <path d="M5.5 1v2M5.5 8v2M1 5.5h2M8 5.5h2M2.2 2.2l1.3 1.3M7.5 7.5l1.3 1.3M8.8 2.2L7.5 3.5M3.5 7.5L2.2 8.8"
                stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="text-primary" strokeOpacity="0.65" />
            </svg>
            <span className="text-[11px] font-mono text-primary tracking-widest uppercase">
              Генератар Спеў
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-foreground mb-4 leading-tight italic">
            Стварыце{" "}
            <span className="text-primary not-italic">беларускі тэкст</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            Выберыце жанр, настроенне і тэму — генератар стварыць структураваны
            тэкст для вашай песні на беларускай мове.
          </p>
        </div>

        <LyricsGenerator />

        {/* Tip box */}
        <div className="mt-10 max-w-4xl mx-auto glass rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground/70">
            <span className="text-primary/70 font-mono">ПАДКАЗКА:</span>{" "}
            Скапіюйце згенераваны тэкст і выкарыстоўвайце яго для стварэння музыкі
            ў любым зручным інструменце. Захавайце праз асабісты кабінет, каб назапашваць тэксты.
          </p>
        </div>
      </div>
    </div>
  );
}
