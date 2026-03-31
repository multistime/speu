"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Check, Loader2, Music, Sliders, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const serviceSchema = z.object({
  name: z.string().min(2, "Імя павінна мець не менш за 2 сімвалы"),
  email: z.string().email("Увядзіце сапраўдны email"),
  serviceType: z.enum(["composition", "text-to-song", "mixing"]),
  description: z.string().min(20, "Калі ласка, апішыце ваш праект падрабязна (20+ сімвалаў)"),
  budget: z.string().optional(),
  deadline: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

const SERVICE_TYPES = [
  {
    value: "composition" as const,
    label: "Аўтарская кампазіцыя",
    description: "Арыгінальная музыка на беларускай мове",
    icon: Music,
    color: "#4ade80",
    colorLight: "#3D6B98",
  },
  {
    value: "text-to-song" as const,
    label: "Тэкст у песню",
    description: "Ваш тэкст → гатовая песня на пляцоўках",
    icon: FileText,
    color: "#fbbf24",
    colorLight: "#fbbf24",
  },
  {
    value: "mixing" as const,
    label: "Мікшынг і мастэрынг",
    description: "Прафесійная апрацоўка вашых запісаў",
    icon: Sliders,
    color: "#c084fc",
    colorLight: "#c084fc",
  },
];

const BUDGETS = [
  "< $200",
  "$200 – $500",
  "$500 – $1,000",
  "$1,000 – $2,500",
  "$2,500+",
];

/* Shared input className — adapts to both themes */
const inputBase = cn(
  "w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200",
  "dark:bg-white/5 bg-foreground/[0.04]",
  "dark:text-white text-foreground",
  "dark:placeholder:text-white/25 placeholder:text-foreground/35",
);

export function ServicesForm() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* Detect dark mode for inline-style icon/text colours */
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { serviceType: "composition" },
  });

  const selectedType = watch("serviceType");

  const onSubmit = async (data: ServiceFormValues) => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    console.log("Order submitted:", data);
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl dark:border-[rgba(74,222,128,0.2)] border-[rgba(61,107,152,0.25)] p-12 text-center"
      >
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full dark:bg-[rgba(74,222,128,0.1)] dark:border-[rgba(74,222,128,0.3)] bg-[rgba(61,107,152,0.08)] border border-[rgba(61,107,152,0.25)] mb-6">
          <Check className="h-8 w-8 dark:text-[#4ade80] text-[#3D6B98]" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Заяўка атрымана
        </h3>
        <p className="dark:text-white/50 text-foreground/60 text-sm max-w-sm mx-auto">
          Мы звяжамся з вамі на працягу 24 гадзін. Сігнал падарожнічае праз лес.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Service type selector */}
      <div>
        <label className="text-xs font-mono dark:text-white/40 text-foreground/50 uppercase tracking-widest block mb-3">
          Тып паслугі
        </label>
        <div className="grid sm:grid-cols-3 gap-3">
          {SERVICE_TYPES.map(({ value, label, description, icon: Icon, color, colorLight }) => {
            const isSelected = selectedType === value;
            const activeColor = isDark ? color : colorLight;
            return (
              <motion.button
                key={value}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setValue("serviceType", value)}
                className={cn(
                  "relative text-left p-4 rounded-xl border transition-all duration-300",
                  isSelected
                    ? "dark:border-[rgba(74,222,128,0.4)] dark:bg-[rgba(74,222,128,0.06)]"
                    : "dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:border-white/[0.15] border-border bg-foreground/[0.02] hover:border-border/60"
                )}
                style={
                  isSelected
                    ? {
                        borderColor: `${activeColor}55`,
                        backgroundColor: `${activeColor}10`,
                      }
                    : undefined
                }
              >
                <Icon
                  className={cn(
                    "h-5 w-5 mb-2 transition-colors",
                    isSelected ? "" : "dark:text-white/30 text-foreground/40"
                  )}
                  strokeWidth={1.5}
                  style={isSelected ? { color: activeColor } : undefined}
                />
                <p
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isSelected ? "" : "dark:text-white/70 text-foreground/75"
                  )}
                  style={isSelected ? { color: activeColor } : undefined}
                >
                  {label}
                </p>
                <p className="text-xs dark:text-white/30 text-foreground/45 mt-0.5">
                  {description}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Name + Email */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono dark:text-white/40 text-foreground/50 uppercase tracking-widest block mb-2">
            Ваша імя
          </label>
          <input
            {...register("name")}
            placeholder="Васіль Быкаў"
            className={cn(
              inputBase,
              errors.name
                ? "border-red-500/40 focus:border-red-500/70"
                : "dark:border-white/10 border-border dark:focus:border-[rgba(74,222,128,0.4)] dark:focus:bg-[rgba(74,222,128,0.03)] focus:border-[rgba(61,107,152,0.45)] focus:bg-[rgba(61,107,152,0.04)]"
            )}
          />
          {errors.name && (
            <p className="text-xs text-red-400/70 mt-1">{errors.name.message}</p>
          )}
        </div>
        <div>
          <label className="text-xs font-mono dark:text-white/40 text-foreground/50 uppercase tracking-widest block mb-2">
            Эл. пошта
          </label>
          <input
            {...register("email")}
            type="email"
            placeholder="you@example.com"
            className={cn(
              inputBase,
              errors.email
                ? "border-red-500/40 focus:border-red-500/70"
                : "dark:border-white/10 border-border dark:focus:border-[rgba(74,222,128,0.4)] dark:focus:bg-[rgba(74,222,128,0.03)] focus:border-[rgba(61,107,152,0.45)] focus:bg-[rgba(61,107,152,0.04)]"
            )}
          />
          {errors.email && (
            <p className="text-xs text-red-400/70 mt-1">{errors.email.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-mono dark:text-white/40 text-foreground/50 uppercase tracking-widest block mb-2">
          Апісанне праекта
        </label>
        <textarea
          {...register("description")}
          rows={4}
          placeholder="Апішыце ваш праект — жанр, настрой, рэферэнсы, мэта…"
          className={cn(
            inputBase,
            "resize-none",
            errors.description
              ? "border-red-500/40 focus:border-red-500/70"
              : "dark:border-white/10 border-border dark:focus:border-[rgba(74,222,128,0.4)] dark:focus:bg-[rgba(74,222,128,0.03)] focus:border-[rgba(61,107,152,0.45)] focus:bg-[rgba(61,107,152,0.04)]"
          )}
        />
        {errors.description && (
          <p className="text-xs text-red-400/70 mt-1">{errors.description.message}</p>
        )}
      </div>

      {/* Budget + Deadline */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono dark:text-white/40 text-foreground/50 uppercase tracking-widest block mb-2">
            Бюджэт (неабавязкова)
          </label>
          <select
            {...register("budget")}
            className={cn(
              inputBase,
              "dark:border-white/10 border-border",
              "dark:focus:border-[rgba(74,222,128,0.4)] focus:border-[rgba(61,107,152,0.45)]",
              "appearance-none cursor-pointer",
              "dark:text-white/70 text-foreground/70",
            )}
          >
            <option value="" className="dark:bg-[#0b1210] bg-[#F6F2E8]">Выберыце дыяпазон…</option>
            {BUDGETS.map((b) => (
              <option key={b} value={b} className="dark:bg-[#0b1210] bg-[#F6F2E8]">
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-mono dark:text-white/40 text-foreground/50 uppercase tracking-widest block mb-2">
            Тэрмін (неабавязкова)
          </label>
          <input
            {...register("deadline")}
            type="date"
            className={cn(
              inputBase,
              "dark:border-white/10 border-border",
              "dark:focus:border-[rgba(74,222,128,0.4)] focus:border-[rgba(61,107,152,0.45)]",
              "dark:text-white/70 text-foreground/70",
              "dark:[color-scheme:dark] [color-scheme:light]",
            )}
          />
        </div>
      </div>

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-sm transition-all duration-300",
          isSubmitting
            ? "dark:bg-white/[0.08] bg-foreground/[0.06] dark:text-white/30 text-foreground/30 cursor-wait"
            : "dark:bg-[#4ade80] dark:text-[#0b1210] dark:hover:shadow-[0_0_30px_rgba(74,222,128,0.5)] bg-[#3D6B98] text-white hover:shadow-[0_0_30px_rgba(61,107,152,0.4)] hover:scale-[1.01]"
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Адпраўка…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Адправіць заяўку
          </>
        )}
      </motion.button>
    </form>
  );
}
