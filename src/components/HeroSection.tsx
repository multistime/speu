"use client";

import { motion } from "framer-motion";
import { useSyncExternalStore, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TopographicCanvas } from "./TopographicCanvas";
import { AudioPlayer } from "./AudioPlayer";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

function subscribeToClass(cb: () => void) {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

type HeroSectionProps = {
  showGeneratorLink?: boolean;
  showServicesLink?: boolean;
};

export function HeroSection({
  showGeneratorLink = true,
  showServicesLink = true,
}: HeroSectionProps) {
  const [showAnimatedBackdrop, setShowAnimatedBackdrop] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setShowAnimatedBackdrop(!media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const isDark = useSyncExternalStore(
    subscribeToClass,
    () => document.documentElement.classList.contains("dark"),
    () => true
  );

  // Theme-resolved color shortcuts
  const accent      = isDark ? "#7DBF9E" : "#35654D";
  const accentRgb   = isDark ? "125,191,158" : "53,101,77";
  const fg          = isDark ? "#E2E8DD" : "#191D18";
  const fgSub       = isDark ? "#C8DDD0" : "#4A5C4E";
  const fgMuted     = isDark ? "rgba(200,221,208,0.60)" : "rgba(45,65,50,0.65)";
  const fgDim       = isDark ? "rgba(200,221,208,0.40)" : "rgba(45,65,50,0.40)";
  const fgGhost     = isDark ? "rgba(200,221,208,0.25)" : "rgba(45,65,50,0.25)";
  const badgeBorder = isDark ? `rgba(${accentRgb},0.22)` : `rgba(${accentRgb},0.18)`;
  const badgeBg     = `rgba(${accentRgb},0.06)`;
  const ctaPrimBg   = isDark ? "#7DBF9E" : "#35654D";
  const ctaPrimFg   = isDark ? "#0E1811" : "#FFFFFF";
  const ctaGlow     = `rgba(${accentRgb},${isDark ? "0.38" : "0.28"})`;
  const ctaSecBrd   = `rgba(${accentRgb},0.22)`;
  const ctaSecFg    = isDark ? "rgba(200,221,208,0.65)" : "rgba(45,65,50,0.65)";
  const scrollLine  = `rgba(${accentRgb},0.35)`;
  const accentShadow = `0 0 20px rgba(${accentRgb},0.45), 0 0 40px rgba(${accentRgb},0.18)`;

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background"
      style={{ color: fg }}
    >
      {/* Generative topographic background */}
      {showAnimatedBackdrop ? (
        <TopographicCanvas isDark={isDark} />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              isDark
                ? "radial-gradient(circle at 50% 40%, rgba(14,28,22,0.95) 0%, rgba(11,18,16,0.97) 55%, rgba(6,10,8,1) 100%)"
                : "radial-gradient(circle at 50% 40%, rgba(246,242,232,1) 0%, rgba(242,237,224,1) 55%, rgba(234,229,212,1) 100%)",
          }}
          aria-hidden
        />
      )}

      {/* Ambient glow orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-[140px]"
          style={{ background: `rgba(${accentRgb},${isDark ? "0.035" : "0.05"})` }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-[120px]"
          style={{ background: isDark ? "rgba(212,148,74,0.025)" : "rgba(191,117,53,0.04)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[180px]"
          style={{ background: `rgba(${accentRgb},${isDark ? "0.015" : "0.03"})` }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16">

          {/* Left: Text content */}
          <div className="flex-1 text-center lg:text-left max-w-2xl">

            {/* Badge */}
            <motion.div
              {...fadeUp}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6"
              style={{ borderColor: badgeBorder, backgroundColor: badgeBg }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <circle cx="6" cy="6" r="1.5" fill={accent} />
                <path
                  d="M6 1v2M6 9v2M1 6h2M9 6h2M2.5 2.5l1.4 1.4M8.1 8.1l1.4 1.4M9.5 2.5L8.1 3.9M3.9 8.1L2.5 9.5"
                  stroke={accent}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeOpacity="0.7"
                />
              </svg>
              <span
                className="text-[11px] font-mono tracking-widest uppercase"
                style={{ color: accent }}
              >
                Беларускі музычны лейбл
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...fadeUp}
              transition={{ delay: 0.35, duration: 0.7 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6"
              style={{ color: fg }}
            >
              <span className="font-display italic font-semibold" style={{ color: fg }}>
                Генератыўная{" "}
              </span>
              <span className="relative inline-block">
                <span
                  className="font-display italic"
                  style={{ color: accent, textShadow: accentShadow }}
                >
                  музыка
                </span>
                {/* Kupalle wave underline */}
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 300 8"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path
                    d="M0 6 Q75 2 150 6 Q225 10 300 6"
                    stroke={`rgba(${accentRgb},0.35)`}
                    strokeWidth="1.5"
                    fill="none"
                  />
                </svg>
              </span>
              <br />
              <span className="font-display italic font-light" style={{ color: fgSub }}>
                на беларускай мове
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              {...fadeUp}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-base sm:text-lg mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed"
              style={{ color: fgMuted }}
            >
              Мы ствараем добрую музыку на беларускай мове — ад фолку да
              электронікі. Корань у зямлі. Голас наперадзе.
            </motion.p>

            {/* CTA buttons */}
            {(showGeneratorLink || showServicesLink) && (
              <motion.div
                {...fadeUp}
                transition={{ delay: 0.65, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
              >
                {showGeneratorLink && (
                  <Link
                    href="/generator"
                    className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      backgroundColor: ctaPrimBg,
                      color: ctaPrimFg,
                      boxShadow: `0 0 20px ${ctaGlow}`,
                    }}
                  >
                    Напісаць тэкст
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                )}
                {showServicesLink && (
                  <Link
                    href="/services"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border font-medium text-sm transition-all duration-300 hover:bg-primary/5 hover:text-foreground"
                    style={{
                      borderColor: ctaSecBrd,
                      color: ctaSecFg,
                    }}
                  >
                    Замовіць песню
                  </Link>
                )}
              </motion.div>
            )}

            {/* Stats */}
            <motion.div
              {...fadeUp}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex items-center gap-8 mt-10 justify-center lg:justify-start"
            >
              {[
                { label: "Выданні",    value: "12+" },
                { label: "Слухачы",   value: "4.2k" },
                { label: "Інструменты", value: "3" },
              ].map(({ label, value }) => (
                <div key={label} className="text-center lg:text-left">
                  <p className="font-display text-2xl font-semibold" style={{ color: accent }}>
                    {value}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: fgDim }}>
                    {label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Audio player */}
          <div className="flex-shrink-0 w-full lg:w-auto flex justify-center">
            <AudioPlayer isDark={isDark} />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
      >
        <span
          className="text-[10px] font-mono tracking-widest uppercase"
          style={{ color: fgGhost }}
        >
          Гартай
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-8"
          style={{
            background: `linear-gradient(to bottom, ${scrollLine}, transparent)`,
          }}
        />
      </motion.div>

      {/* Gradient transition into themed page below */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-[5]"
        style={{
          background: "linear-gradient(to bottom, transparent, var(--background))",
        }}
      />
    </section>
  );
}
