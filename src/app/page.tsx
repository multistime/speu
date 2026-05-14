import { HeroSection } from "@/components/HeroSection";
import { SupportTiers } from "@/components/SupportTiers";
import Link from "next/link";
import { ArrowRight, Sparkles, Headphones, Heart, Radio } from "lucide-react";
import { blockPayload, getPageBlocks } from "@/lib/supabase/public-content";
import { getHomePageSlug } from "@/lib/site-home";
import { getVisiblePublicHrefs } from "@/lib/site-visibility";

// Rhombic ornament divider — echoes traditional embroidery (вышыўка) motifs
function OrnamentDivider() {
  return (
    <div className="flex items-center justify-center gap-3 opacity-30 py-2" aria-hidden>
      <div className="h-px flex-1 max-w-20 bg-gradient-to-r from-transparent to-border" />
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
      <div className="h-px flex-1 max-w-20 bg-gradient-to-l from-transparent to-border" />
    </div>
  );
}

export default async function HomePage() {
  const visible = await getVisiblePublicHrefs();
  const showGenerator = visible.has("/generator");
  const showRadio = visible.has("/radio");
  const showSupport = visible.has("/support");

  const homeSlug = await getHomePageSlug();
  const blocks = await getPageBlocks(homeSlug);
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

      {/* About / Philosophy */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            {/* Section label — less mono-heavy, more typographic */}
            <p className="text-xs uppercase tracking-[0.18em] text-primary/70 mb-4 font-medium">
              {String(about.label)}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-6 leading-[1.2] italic">
              {String(about.title)}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {String(about.body)}
            </p>
            <p className="text-muted-foreground/70 leading-relaxed text-sm">
              {String(about.subbody)}
            </p>
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
                className="glass rounded-xl p-4 border border-border hover:border-primary/25 transition-all duration-300 group"
              >
                <Icon
                  className="h-5 w-5 text-primary mb-3 opacity-60 group-hover:opacity-100 transition-opacity"
                  strokeWidth={1.5}
                />
                <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {(showGenerator || showRadio) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <OrnamentDivider />
        </div>
      )}

      {showGenerator && (
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/4 to-transparent" />
          <div className="absolute inset-0 border-y border-border" />

          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-50"
            aria-hidden>
            <svg className="absolute right-0 top-0 h-full opacity-[0.04] text-primary" viewBox="0 0 200 200" fill="none">
              <path d="M100 10L190 100L100 190L10 100Z" stroke="currentColor" strokeWidth="1" />
              <path d="M100 40L160 100L100 160L40 100Z" stroke="currentColor" strokeWidth="0.8" />
              <path d="M100 70L130 100L100 130L70 100Z" fill="currentColor" />
            </svg>
          </div>

          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-primary/70 mb-4 font-medium">
              {String(generatorCta.label)}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-4 italic">
              {String(generatorCta.title)}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-sm leading-relaxed">
              {String(generatorCta.description)}
            </p>
            <Link
              href={String((generatorCta.button as { href?: string })?.href ?? "/generator")}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:scale-[1.02] transition-all duration-300 glow-primary"
            >
              <Sparkles className="h-4 w-4" />
              {String((generatorCta.button as { label?: string })?.label ?? "Адкрыць генератар")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {showGenerator && showRadio && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <OrnamentDivider />
        </div>
      )}

      {showRadio && (
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto glass rounded-2xl border border-border p-8 sm:p-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/22 bg-primary/6 mb-5">
              <Radio className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-mono text-primary tracking-widest uppercase">
                {String(radioCta.label)}
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-4 italic">
              {String(radioCta.title)}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm leading-relaxed mb-7">
              {String(radioCta.description)}
            </p>
            <Link
              href={String((radioCta.button as { href?: string })?.href ?? "/radio")}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:scale-[1.02] transition-all duration-300 glow-primary"
            >
              <Radio className="h-4 w-4" />
              {String((radioCta.button as { label?: string })?.label ?? "Слухаць Радыё Мара")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {showSupport && (
        <section className="py-28 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-[0.18em] text-primary/70 mb-4 font-medium">
                {String(supportHeader.label)}
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-4 italic">
                {String(supportHeader.title)}
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
                {String(supportHeader.description)}
              </p>
            </div>
            <SupportTiers />
          </div>
        </section>
      )}

    </>
  );
}
