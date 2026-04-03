"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Heart, Loader2, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tier {
  id: string;
  name: string;
  belarusian: string;
  price: string;
  period: string;
  description: string;
  perks: string[];
  highlighted: boolean;
  icon: typeof Heart;
  // Using CSS-variable-safe colors that work in both light and dark themes
  accentColor: string;
  glowRgb: string;
}

const PLACEHOLDER_TIERS: Tier[] = [
  {
    id: "supporter",
    name: "Падтрымальнік",
    belarusian: "Падтрымальнік",
    price: "$5",
    period: "/мес",
    description: "Музыка на роднай мове жыве дзякуючы вам. Кожны ўклад мае значэнне.",
    perks: [
      "Ранні доступ да новых выданняў",
      "Імя ў альбомных крэдытах",
      "Прыватная рассылка лейбла",
      "Штомесячны дайджэст",
    ],
    highlighted: false,
    icon: Heart,
    // Лясны мох — асноўны зялёны акцэнт светлай тэмы (згодна з handoff)
    accentColor: "#35654D",
    glowRgb: "53, 101, 77",
  },
  {
    id: "patron",
    name: "Мецэнат",
    belarusian: "Мецэнат",
    price: "$15",
    period: "/мес",
    description: "Уваходзіце глыбей. Фармуйце тое, што мы ствараем.",
    perks: [
      "Усё ад узроўню Падтрымальнік",
      "Галасаванне за тэмы наступных выданняў",
      "Сцябліны і файлы праекта",
      "Эксклюзіўныя B-сайды і дэмо",
      "Штомесячная слуханка",
    ],
    highlighted: true,
    icon: Star,
    // Kupalle bonfire amber
    accentColor: "#C07A30",
    glowRgb: "192, 122, 48",
  },
  {
    id: "coproducer",
    name: "Сасупрадзюсар",
    belarusian: "Сасупрадзюсар",
    price: "$50",
    period: "/мес",
    description: "Станьце часткай лейбла. Ваша імя — на запісе.",
    perks: [
      "Усё ад узроўню Мецэнат",
      "Крэдыт сасупрадзюсара на выданнях",
      "Замова аднаго аўтарскага трэка ў год",
      "Доля раялці на сумесных выданнях",
      "Прыватныя сесіі абмеркавання (анлайн)",
      "Уплыў на стратэгію лейбла",
    ],
    highlighted: false,
    icon: Zap,
    // Sage / forest orchid purple
    accentColor: "#7B5EA7",
    glowRgb: "123, 94, 167",
  },
];

const iconByCode: Record<string, typeof Heart> = {
  supporter: Heart,
  patron: Star,
  coproducer: Zap,
};

function mapApiTier(tier: {
  code: string;
  name: string;
  label_be: string | null;
  description: string | null;
  price_amount: number;
  period: string;
  perks: string[];
  highlighted: boolean;
  accent_color: string | null;
  glow_rgb: string | null;
}): Tier {
  return {
    id: tier.code,
    name: tier.name,
    belarusian: tier.label_be ?? tier.name,
    price: `$${tier.price_amount}`,
    period: tier.period,
    description: tier.description ?? "",
    perks: tier.perks ?? [],
    highlighted: tier.highlighted,
    icon: iconByCode[tier.code] ?? Heart,
    accentColor: tier.accent_color ?? "#35654D",
    glowRgb: tier.glow_rgb ?? "53, 101, 77",
  };
}

export function SupportTiers() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadNonce, setLoadNonce] = useState(0);

  const loadTiers = useCallback(async (signal: AbortSignal) => {
    setStatus("loading");
    try {
      let usePlaceholder = false;
      try {
        const settingsRes = await fetch("/api/public/site-settings?key=support_show_placeholder", {
          signal,
        });
        const settingsJson = settingsRes.ok
          ? ((await settingsRes.json().catch(() => ({}))) as { settings?: Record<string, string> })
          : {};
        if (signal.aborted) return;
        usePlaceholder =
          settingsRes.ok && settingsJson.settings?.support_show_placeholder !== "false";
      } catch {
        if (signal.aborted) return;
        usePlaceholder = false;
      }

      if (usePlaceholder) {
        setTiers(PLACEHOLDER_TIERS);
        setStatus("ready");
        return;
      }

      const response = await fetch("/api/public/support-tiers", { signal });
      if (signal.aborted) return;
      if (!response.ok) {
        setTiers([]);
        setStatus("error");
        return;
      }
      const json = (await response.json()) as {
        items?: Array<{
          code: string;
          name: string;
          label_be: string | null;
          description: string | null;
          price_amount: number;
          period: string;
          perks: string[];
          highlighted: boolean;
          accent_color: string | null;
          glow_rgb: string | null;
        }>;
      };
      if (signal.aborted) return;
      const items = json.items ?? [];
      setTiers(items.map(mapApiTier));
      setStatus("ready");
    } catch {
      if (signal.aborted) return;
      setTiers([]);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    void loadTiers(ac.signal);
    return () => ac.abort();
  }, [loadTiers, loadNonce]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 md:py-28 text-muted-foreground max-w-5xl mx-auto">
        <Loader2 className="h-10 w-10 animate-spin text-primary/70" strokeWidth={1.25} />
        <p className="text-sm">Загрузка ўзроўняў падтрымкі…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 md:py-24 text-center px-4 max-w-5xl mx-auto">
        <Heart className="h-10 w-10 text-muted-foreground/30" strokeWidth={1} />
        <p className="text-sm text-muted-foreground max-w-sm">
          Не ўдалося загрузіць узроўні падтрымкі. Праверце злучэнне і паспрабуйце яшчэ раз.
        </p>
        <button
          type="button"
          onClick={() => setLoadNonce((n) => n + 1)}
          className="text-sm font-medium px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted/60 transition-colors"
        >
          Паўтарыць
        </button>
      </div>
    );
  }

  if (tiers.length === 0) {
    return (
      <div className="text-center py-16 md:py-20 text-muted-foreground max-w-5xl mx-auto">
        <Heart className="h-10 w-10 mx-auto mb-3 opacity-20" strokeWidth={1} />
        <p className="text-sm">Узроўні падтрымкі пакуль не наладжаны</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {tiers.map((tier, i) => {
        const Icon = tier.icon;
        return (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative group"
          >
            {/* Most popular badge */}
            {tier.highlighted && (
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-semibold"
                style={{
                  backgroundColor: `rgba(${tier.glowRgb}, 0.13)`,
                  border: `1px solid rgba(${tier.glowRgb}, 0.40)`,
                  color: tier.accentColor,
                }}
              >
                Найбольш папулярны
              </div>
            )}

            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={cn(
                "relative h-full glass rounded-2xl p-6 flex flex-col overflow-hidden transition-all duration-300",
                tier.highlighted
                  ? "border-[1.5px]"
                  : "border border-border hover:border-primary/20"
              )}
              style={
                tier.highlighted
                  ? { borderColor: `rgba(${tier.glowRgb}, 0.40)` }
                  : undefined
              }
            >
              {/* Background glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                style={{
                  background: `radial-gradient(ellipse at 50% 0%, rgba(${tier.glowRgb}, 0.08) 0%, transparent 65%)`,
                }}
              />

              {/* Icon + belarusian label */}
              <div className="relative flex items-start justify-between mb-4">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: `rgba(${tier.glowRgb}, 0.10)`,
                    border: `1px solid rgba(${tier.glowRgb}, 0.25)`,
                  }}
                >
                  <Icon
                    className="h-5 w-5"
                    strokeWidth={1.5}
                    style={{ color: tier.accentColor }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground/60 font-mono">
                  {tier.belarusian}
                </span>
              </div>

              <h3 className="font-semibold text-foreground text-lg mb-1">
                {tier.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {tier.description}
              </p>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-6">
                <span
                  className="text-3xl font-bold font-display"
                  style={{ color: tier.accentColor }}
                >
                  {tier.price}
                </span>
                <span className="text-sm text-muted-foreground/60">{tier.period}</span>
              </div>

              {/* Perks */}
              <ul className="space-y-2 mb-8 flex-1">
                {tier.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5">
                    <div
                      className="mt-0.5 h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `rgba(${tier.glowRgb}, 0.12)` }}
                    >
                      <Check
                        className="h-2.5 w-2.5"
                        strokeWidth={2.5}
                        style={{ color: tier.accentColor }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      {perk}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                className={cn(
                  "w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300",
                  tier.highlighted
                    ? "text-white"
                    : "border text-foreground/70 hover:text-foreground"
                )}
                style={
                  tier.highlighted
                    ? {
                        backgroundColor: tier.accentColor,
                        boxShadow: `0 0 18px rgba(${tier.glowRgb}, 0.30)`,
                      }
                    : {
                        borderColor: `rgba(${tier.glowRgb}, 0.28)`,
                        backgroundColor: `rgba(${tier.glowRgb}, 0.06)`,
                      }
                }
                onMouseEnter={(e) => {
                  if (!tier.highlighted) {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      `0 0 16px rgba(${tier.glowRgb}, 0.20)`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!tier.highlighted) {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                  }
                }}
              >
                Падтрымаць як {tier.name}
              </motion.button>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
