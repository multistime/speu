import { SupportTiers } from "@/components/SupportTiers";
import { Heart } from "lucide-react";

export const metadata = {
  title: "Падтрымка — Спеў",
  description: "Падтрымайце беларускі музычны лейбл Спеў і дапамажыце зрабіць больш добрай музыкі на роднай мове.",
};

export default function SupportPage() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/8 border border-primary/20 mb-6 mx-auto">
            <Heart className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-foreground mb-4 italic">
            Падтрымай беларускую музыку
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            Спеў — незалежны лейбл. Ваша падтрымка ідзе наўпрост на стварэнне
            музыкі, развіццё інструментаў для беларускамоўных артыстаў і падтрымку
            нашай супольнасці.
          </p>
        </div>

        <SupportTiers />

        {/* One-time donate */}
        <div className="mt-16 text-center">
          <div className="glass rounded-2xl border border-border p-8 max-w-md mx-auto">
            <p className="text-muted-foreground text-sm mb-4">
              Аддаяце перавагу аднаразоваму ўнёску?
            </p>
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-primary/28 text-primary text-sm font-medium hover:bg-primary/8 hover:border-primary/45 transition-all duration-300">
              <Heart className="h-4 w-4" />
              Аднаразовы донат
            </button>
            <p className="text-xs text-muted-foreground/40 mt-3">
              Праз Ko-fi, крыпту або банкаўскі пераклад — звяжыцеся з намі
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
