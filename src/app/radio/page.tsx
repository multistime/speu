import { Radio, Waves, CirclePlay } from "lucide-react";

export const metadata = {
  title: "Радыё Мара — Спеў",
  description:
    "Радыё Мара — онлайн-радыё Speu, якое 24/7 круціць беларускі плэйліст у выпадковым парадку.",
};

export default function RadioPage() {
  const streamUrl = process.env.NEXT_PUBLIC_RADYO_MARA_STREAM_URL ?? "";

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
            Радыё Мара - гэта бесперапынны струмень беларускай музыкі ад Speu.
            Мы круцім наш плэйліст у выпадковым парадку, каб побач з вядомымі
            трэкамі заўсёды адкрываліся новыя галасы, новыя словы і новыя настроі.
          </p>
        </div>

        <div className="glass rounded-2xl border border-border p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <Waves className="h-5 w-5 text-primary/70" />
            <p className="text-sm text-foreground font-medium">
              Жывы эфір Радыё Мара
            </p>
          </div>

          {streamUrl ? (
            <audio controls autoPlay className="w-full" src={streamUrl}>
              Ваш браўзер не падтрымлівае прайграванне аўдыя.
            </audio>
          ) : (
            <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5 text-sm text-muted-foreground">
              Дадайце зменную асяроддзя
              {" "}
              <span className="font-mono text-primary/80">
                NEXT_PUBLIC_RADYO_MARA_STREAM_URL
              </span>
              {" "}
              са спасылкай на аўдыя-струмень, каб уключыць онлайн-радыё.
            </div>
          )}
        </div>

        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          {[
            {
              title: "Неперарыўна",
              desc: "Эфір працуе 24/7 без перапынкаў.",
              icon: CirclePlay,
            },
            {
              title: "Выпадковы парадак",
              desc: "Плэйліст круціцца ў жывой выпадковай чарзе.",
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
