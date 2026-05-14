import Link from "next/link";
import { ArrowRight, Headphones, Heart, Radio, Sparkles } from "lucide-react";
import { HeroSection } from "@/components/HeroSection";
import { SupportTiers } from "@/components/SupportTiers";
import { blockPayload, getPageBlocks } from "@/lib/supabase/public-content";
import { getVisiblePublicHrefs } from "@/lib/site-visibility";

/** Рымбічны падзел — намёк на традыцыю вышыўкі */
function OrnamentDivider() {
  return (
    <div className="flex items-center justify-center gap-3 py-2 opacity-30" aria-hidden>
      <div className="h-px max-w-20 flex-1 bg-gradient-to-r from-transparent to-border" />
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 1L17 9L9 17L1 9Z" stroke="currentColor" strokeWidth="0.8" className="text-primary" />
        <path d="M9 5L13 9L9 13L5 9Z" fill="currentColor" className="text-primary" fillOpacity="0.3" />
      </svg>
      <div className="h-px w-1.5 bg-border" />
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M5 1L9 5L5 9L1 5Z" fill="currentColor" className="text-primary" fillOpacity="0.25" />
      </svg>
      <div className="h-px w-1.5 bg-border" />
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 1L17 9L9 17L1 9Z" stroke="currentColor" strokeWidth="0.8" className="text-primary" />
        <path d="M9 5L13 9L9 13L5 9Z" fill="currentColor" className="text-primary" fillOpacity="0.3" />
      </svg>
      <div className="h-px max-w-20 flex-1 bg-gradient-to-l from-transparent to-border" />
    </div>
  );
}

type ClassicSpeuLandingProps = {
  /** Slug у `speu.content_pages`, адкуль чытаць `content_blocks` */
  contentSlug: string;
};

export async function ClassicSpeuLanding({ contentSlug }: ClassicSpeuLandingProps) {
  const visible = await getVisiblePublicHrefs();
  const showGenerator = visible.has("/generator");
  const showRadio = visible.has("/radio");
  const showSupport = visible.has("/support");

  const blocks = await getPageBlocks(contentSlug);
  const about = blockPayload(blocks, "about", {
    label: "Пра нас",
    title: "Там, дзе старажытны спеў сустракае новы гук",
    body:
      "Спеў — беларускі музычны лейбл. Наша місія простая: каб было больш добрай музыкі на беларускай мове і ў яе было больш слухачоў. Мы ствараем яе самі і дапамагаем іншым рабіць гэта.",
    subbody:
      "Беларуская мова можа гучаць у любым жанры — у фолку і электроніцы, у попе і амбіенце. Каранямі мы ў традыцыі: вуснай творчасці, прыродзе, продках. Поглядам — наперад. Слова жыве, пакуль яно гучыць.",
  });
  const generatorCta = blockPayload(blocks, "generator_cta", {
    label: "Наш інструмент",
    title: "Напішыце тэкст для вашай песні",
    description:
      "Генератар Спеў дапамагае ствараць тэксты на беларускай мове: выберыце жанр, настроенне і тэму — і атрымайце гатовую структуру песні за секунды.",
    button: { label: "Адкрыць генератар", href: "/generator" },
  });
  const radioCta = blockPayload(blocks, "radio_cta", {
    label: "Новае ад Спеў",
    title: "Радыё Мара",
    description:
      "Радыё Мара — наша онлайн-радыёстанцыя, якая кругласутачна круціць беларускі плэйліст у выпадковым парадку. Яе мэта — каб беларуская музыка і беларускае слова гучалі штодня, без цішыні і межаў.",
    button: { label: "Слухаць Радыё Мара", href: "/radio" },
  });
  const supportHeader = blockPayload(blocks, "support_header", {
    label: "Падтрымай сцэну",
    title: "Падтрымай Спеў",
    description:
      "Беларуская музыка расце разам з яе супольнасцю. Падтрымай лейбл — і стань часткай таго, як беларуская мова гучыць сёння.",
  });

  return (
    <>
      <HeroSection
        showGeneratorLink={showGenerator}
        showServicesLink={visible.has("/services")}
      />

      <section className="mx-auto max-w-7xl px-4 py-28 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-primary/70">
              {String(about.label)}
            </p>
            <h2 className="font-display mb-6 text-3xl font-semibold italic leading-[1.2] text-foreground sm:text-4xl">
              {String(about.title)}
            </h2>
            <p className="mb-4 leading-relaxed text-muted-foreground">{String(about.body)}</p>
            <p className="text-sm leading-relaxed text-muted-foreground/70">{String(about.subbody)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                icon: Sparkles,
                title: "Генерацыя музыкі",
                desc: "Арыгінальныя песні на беларускай мове ў любым жанры",
              },
              {
                icon: Headphones,
                title: "Жывыя артысты",
                desc: "Калабарацыі, AI-каверы і сумесныя праекты",
              },
              ...(showGenerator
                ? [
                    {
                      icon: Heart,
                      title: "Генератар Спеў",
                      desc: "Інструмент для напісання тэкстаў і структуры песень",
                    },
                    {
                      icon: ArrowRight,
                      title: "Вашы тэксты",
                      desc: "Ператворым вашы вершы ў гатовую песню",
                    },
                  ]
                : []),
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="glass group rounded-xl border border-border p-4 transition-all duration-300 hover:border-primary/25"
              >
                <Icon
                  className="mb-3 h-5 w-5 text-primary opacity-60 transition-opacity group-hover:opacity-100"
                  strokeWidth={1.5}
                />
                <h3 className="mb-1 text-sm font-semibold text-foreground">{title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {(showGenerator || showRadio) && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <OrnamentDivider />
        </div>
      )}

      {showGenerator && (
        <section className="relative overflow-hidden py-20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/4 to-transparent" />
          <div className="absolute inset-0 border-y border-border" />

          <div
            className="pointer-events-none absolute inset-0 overflow-hidden opacity-50"
            aria-hidden>
            <svg
              className="absolute right-0 top-0 h-full opacity-[0.04] text-primary"
              viewBox="0 0 200 200"
              fill="none">
              <path d="M100 10L190 100L100 190L10 100Z" stroke="currentColor" strokeWidth="1" />
              <path d="M100 40L160 100L100 160L40 100Z" stroke="currentColor" strokeWidth="0.8" />
              <path d="M100 70L130 100L100 130L70 100Z" fill="currentColor" />
            </svg>
          </div>

          <div className="relative mx-auto max-w-4xl px-4 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-primary/70">
              {String(generatorCta.label)}
            </p>
            <h2 className="font-display mb-4 text-3xl font-semibold italic text-foreground sm:text-4xl">
              {String(generatorCta.title)}
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {String(generatorCta.description)}
            </p>
            <Link
              href={String((generatorCta.button as { href?: string })?.href ?? "/generator")}
              className="glow-primary inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 font-semibold text-primary-foreground transition-all duration-300 hover:scale-[1.02]">
              <Sparkles className="h-4 w-4" />
              {String((generatorCta.button as { label?: string })?.label ?? "Адкрыць генератар")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {showGenerator && showRadio && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <OrnamentDivider />
        </div>
      )}

      {showRadio && (
        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="glass mx-auto max-w-5xl rounded-2xl border border-border p-8 text-center sm:p-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/22 bg-primary/6 px-3 py-1.5">
              <Radio className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-[11px] uppercase tracking-widest text-primary">
                {String(radioCta.label)}
              </span>
            </div>
            <h2 className="font-display mb-4 text-3xl font-semibold italic text-foreground sm:text-4xl">
              {String(radioCta.title)}
            </h2>
            <p className="mx-auto mb-7 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {String(radioCta.description)}
            </p>
            <Link
              href={String((radioCta.button as { href?: string })?.href ?? "/radio")}
              className="glow-primary inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3 font-semibold text-primary-foreground transition-all duration-300 hover:scale-[1.02]">
              <Radio className="h-4 w-4" />
              {String((radioCta.button as { label?: string })?.label ?? "Слухаць Радыё Мара")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {showSupport && (
        <section className="mx-auto max-w-7xl px-4 py-28 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-primary/70">
              {String(supportHeader.label)}
            </p>
            <h2 className="font-display mb-4 text-3xl font-semibold italic text-foreground sm:text-4xl">
              {String(supportHeader.title)}
            </h2>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground">
              {String(supportHeader.description)}
            </p>
          </div>
          <SupportTiers />
        </section>
      )}
    </>
  );
}
