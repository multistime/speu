import { Radio, Waves, CirclePlay } from "lucide-react";
import { RadioPlayer } from "@/components/radio/RadioPlayer";

export const metadata = {
  title: "Радыё Мара — Спеў",
  description:
    "Радыё Мара — онлайн-радыё Speu: плэйліст з каталога песень або жывы струмень.",
};

export default function RadioPage() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/22 bg-primary/6 mb-5">
            <Radio className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-mono text-primary tracking-widest uppercase">
              Радыё Мара
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-foreground mb-4 italic">
            Онлайн-радыё{" "}
            <span className="text-primary not-italic">24/7</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm leading-relaxed">
            Радыё Мара — бесперапынны беларускі гук ад Speu. Калі ў каталогу ёсць песні з
            адзнакай «на радыё», яны круцяцца ў выпадковым парадку ў браўзеры. Таксама можна
            падключыць класічны аўдыя-струмень (Icecast / HLS) у наладах адміністратара.
          </p>
        </div>

        <div className="mb-2 flex items-center gap-3">
          <Waves className="h-5 w-5 text-primary/70" />
          <p className="text-sm text-foreground font-medium">
            Жывы эфір Радыё Мара
          </p>
        </div>

        <RadioPlayer />

        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          {[
            {
              title: "Неперарыўна",
              desc: "Плэйліст або струмень без дадатковай устаноўкі.",
              icon: CirclePlay,
            },
            {
              title: "Выпадковы парадак",
              desc: "Каталожныя трэкі перамешваюцца пры кожным адкрыцці старонкі.",
              icon: Radio,
            },
            {
              title: "Беларуская ідэя",
              desc: "Падтрымліваем мову, культуру і сучасны беларускі гук.",
              icon: Waves,
            },
          ].map(({ title, desc, icon: Icon }) => (
            <div key={title} className="glass rounded-xl border border-border p-4">
              <Icon className="h-4 w-4 text-primary/70 mb-2" />
              <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
