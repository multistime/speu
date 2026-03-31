"use client";

import { useState } from "react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import {
  Sparkles,
  BookmarkPlus,
  Copy,
  Check,
  Loader2,
  GripVertical,
  Pencil,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Genre = "folk-electronic" | "dark-ambient" | "neo-folk" | "glitch-folk" | "forest-techno" | "ritual-drone";
type Mood = "melancholic" | "ritual" | "mystical" | "eerie" | "meditative" | "raw";
type Topic = "swamps" | "forests" | "ancestry" | "mist-rivers" | "old-gods" | "digital-nature" | "forgotten-villages" | "night-birds";

const GENRES: { value: Genre; label: string }[] = [
  { value: "folk-electronic", label: "Фолк-электронны" },
  { value: "dark-ambient", label: "Цёмны амбіент" },
  { value: "neo-folk", label: "Нэа-фолк" },
  { value: "glitch-folk", label: "Глітч-фолк" },
  { value: "forest-techno", label: "Лясны тэхна" },
  { value: "ritual-drone", label: "Рытуальны дрон" },
];

const MOODS: { value: Mood; label: string; color: string }[] = [
  { value: "melancholic", label: "Меланхалічны",  color: "rgba(99,102,241,0.3)" },
  { value: "ritual",      label: "Рытуальны",      color: "rgba(239,68,68,0.25)" },
  { value: "mystical",    label: "Містычны",       color: "rgba(74,222,128,0.25)" },
  { value: "eerie",       label: "Жудасны",        color: "rgba(251,191,36,0.25)" },
  { value: "meditative",  label: "Медытатыўны",    color: "rgba(6,182,212,0.25)" },
  { value: "raw",         label: "Першабытны",     color: "rgba(249,115,22,0.25)" },
];

const TOPICS: { value: Topic; label: string; emoji: string }[] = [
  { value: "swamps",             label: "Балоты",             emoji: "🌿" },
  { value: "forests",            label: "Лясы",               emoji: "🌲" },
  { value: "ancestry",           label: "Продкі",             emoji: "🌑" },
  { value: "mist-rivers",        label: "Туманныя рэкі",      emoji: "〰️" },
  { value: "old-gods",           label: "Старыя багі",        emoji: "⚡" },
  { value: "digital-nature",     label: "Лічбавая прырода",   emoji: "🤖" },
  { value: "forgotten-villages", label: "Забытыя вёскі",      emoji: "🏚️" },
  { value: "night-birds",        label: "Начныя птушкі",      emoji: "🦉" },
];

interface SunoBlock {
  id: string;
  tag: string;
  lines: string[];
}

const BLOCK_TYPES = [
  "Intro",
  "Verse",
  "Pre-Chorus",
  "Chorus",
  "Bridge",
  "Hook",
  "Break",
  "Instrumental",
  "Outro",
];

const TAG_COLORS: Record<string, { text: string; border: string }> = {
  Verse:          { text: "dark:text-[#4ade80] text-[#3D6B98]",          border: "dark:border-[rgba(74,222,128,0.3)] border-[rgba(61,107,152,0.35)]" },
  Chorus:         { text: "text-[#fbbf24]",                               border: "border-[rgba(251,191,36,0.3)]" },
  Bridge:         { text: "text-[#c084fc]",                               border: "border-[rgba(192,132,252,0.3)]" },
  Outro:          { text: "dark:text-white/50 text-foreground/50",        border: "dark:border-white/10 border-border" },
  Intro:          { text: "dark:text-white/50 text-foreground/50",        border: "dark:border-white/10 border-border" },
  "Pre-Chorus":   { text: "text-[#38bdf8]",                               border: "border-[rgba(56,189,248,0.3)]" },
  Hook:           { text: "text-[#f97316]",                               border: "border-[rgba(249,115,22,0.3)]" },
  Break:          { text: "dark:text-white/30 text-foreground/40",        border: "dark:border-white/[0.08] border-border/50" },
  Instrumental:   { text: "dark:text-white/30 text-foreground/40",        border: "dark:border-white/[0.08] border-border/50" },
};

function parseLyrics(raw: string): SunoBlock[] {
  const blocks: SunoBlock[] = [];
  const parts = raw.split(/(\[[^\]]+\])/g).filter(Boolean);
  let currentTag = "Intro";
  let currentLines: string[] = [];
  let counter = 0;
  const ts = Date.now();

  for (const part of parts) {
    if (/^\[.+\]$/.test(part.trim())) {
      if (currentLines.length > 0) {
        blocks.push({ id: `${ts}-${counter++}`, tag: currentTag, lines: [...currentLines] });
        currentLines = [];
      }
      currentTag = part.replace(/[\[\]]/g, "");
    } else {
      const lines = part.split("\n").filter((l) => l.trim());
      currentLines.push(...lines);
    }
  }
  if (currentLines.length > 0) {
    blocks.push({ id: `${ts}-${counter++}`, tag: currentTag, lines: [...currentLines] });
  }
  return blocks;
}

function SelectChip<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; emoji?: string; color?: string }[];
  value: T | null;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div>
      <p className="text-xs font-mono dark:text-white/40 text-foreground/50 uppercase tracking-widest mb-3">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <motion.button
            key={opt.value}
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200",
              value === opt.value
                ? "dark:border-[rgba(74,222,128,0.5)] dark:bg-[rgba(74,222,128,0.12)] dark:text-[#4ade80] border-[rgba(61,107,152,0.5)] bg-[rgba(61,107,152,0.10)] text-[#3D6B98]"
                : "dark:border-white/10 border-border dark:bg-white/[0.04] bg-foreground/[0.04] dark:text-white/50 text-foreground/70 dark:hover:border-white/20 hover:border-border/60 dark:hover:text-white/80 hover:text-foreground"
            )}
            style={
              value === opt.value && opt.color
                ? { backgroundColor: opt.color }
                : undefined
            }
          >
            {opt.emoji && <span className="mr-1">{opt.emoji}</span>}
            {opt.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function BlockItem({ block, onEdit }: { block: SunoBlock; onEdit: () => void }) {
  const dragControls = useDragControls();
  const colorEntry = TAG_COLORS[block.tag] ?? {
    text: "dark:text-white/50 text-foreground/50",
    border: "dark:border-white/10 border-border",
  };

  return (
    <Reorder.Item
      value={block}
      dragListener={false}
      dragControls={dragControls}
      as="div"
      className="group relative flex items-start gap-2 rounded-lg px-1 py-1 -mx-1 dark:hover:bg-white/[0.03] hover:bg-foreground/[0.025] transition-colors cursor-default select-none"
      onDoubleClick={onEdit}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileDrag={{ scale: 1.01, boxShadow: "0 8px 32px rgba(0,0,0,0.25)", zIndex: 50 }}
    >
      <motion.div
        onPointerDown={(e) => dragControls.start(e)}
        className="mt-[3px] cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-25 hover:!opacity-60 transition-opacity touch-none flex-shrink-0"
        title="Перацягнуць"
      >
        <GripVertical className="h-4 w-4 dark:text-white text-foreground" />
      </motion.div>

      <div className={cn("flex-1 pl-3 border-l-2 min-w-0 py-0.5", colorEntry.border)}>
        <p className={cn("text-[10px] font-mono uppercase tracking-widest mb-2", colorEntry.text)}>
          [{block.tag}]
        </p>
        <div className="space-y-1">
          {block.lines.map((line, li) => (
            <p key={li} className="text-sm dark:text-white/80 text-foreground leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        title="Рэдагаваць блок"
        className="mt-[3px] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg dark:hover:bg-white/10 hover:bg-foreground/[0.07]"
      >
        <Pencil className="h-3 w-3 dark:text-white/40 text-foreground/40" />
      </button>
    </Reorder.Item>
  );
}

export function LyricsGenerator() {
  const [genre, setGenre] = useState<Genre | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(false);
  const [blocks, setBlocks] = useState<SunoBlock[]>([]);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editTag, setEditTag] = useState<string>("Verse");
  const [editText, setEditText] = useState<string>("");

  const canGenerate = genre && mood && topic;

  const generate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    setBlocks([]);
    setSaved(false);
    setEditingIdx(null);

    try {
      const res = await fetch("/api/generate-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genre, mood, topic }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setBlocks(parseLyrics(data.lyrics));
    } catch {
      setError("Памылка генерацыі. Паспрабуйце яшчэ раз.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!blocks.length) return;
    const text = blocks.map((b) => `[${b.tag}]\n${b.lines.join("\n")}`).join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const save = () => {
    setSaved(true);
  };

  const openEdit = (idx: number) => {
    const block = blocks[idx];
    setEditTag(block.tag);
    setEditText(block.lines.join("\n"));
    setEditingIdx(idx);
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    const newBlocks = [...blocks];
    newBlocks[editingIdx] = {
      ...newBlocks[editingIdx],
      tag: editTag,
      lines: editText.split("\n").filter((l) => l.trim()),
    };
    setBlocks(newBlocks);
    setEditingIdx(null);
  };

  const cancelEdit = () => setEditingIdx(null);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">

        {/* Input panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-2xl dark:border-[rgba(74,222,128,0.1)] border-[rgba(61,107,152,0.15)] p-6 flex flex-col gap-6"
        >
          <div>
            <h2 className="font-mono text-sm dark:text-white/40 text-foreground/50 uppercase tracking-widest mb-1">
              Параметры
            </h2>
            <p className="dark:text-white/60 text-foreground/60 text-sm">
              Настроіце атмасферу, затым генеруйце.
            </p>
          </div>

          <SelectChip<Genre>
            label="Жанр"
            options={GENRES}
            value={genre}
            onChange={setGenre}
          />
          <SelectChip<Mood>
            label="Настрой"
            options={MOODS}
            value={mood}
            onChange={setMood}
          />
          <SelectChip<Topic>
            label="Тэма"
            options={TOPICS}
            value={topic}
            onChange={setTopic}
          />

          <motion.button
            onClick={generate}
            disabled={!canGenerate || loading}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "mt-auto flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300",
              canGenerate && !loading
                ? "dark:bg-[#4ade80] dark:text-[#0b1210] dark:hover:shadow-[0_0_30px_rgba(74,222,128,0.5)] bg-[#3D6B98] text-white hover:shadow-[0_0_30px_rgba(61,107,152,0.4)] hover:scale-[1.01]"
                : "dark:bg-white/[0.08] bg-foreground/[0.06] dark:text-white/30 text-foreground/30 cursor-not-allowed"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Генерацыя…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Стварыць тэкст
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Output panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass rounded-2xl dark:border-[rgba(74,222,128,0.1)] border-[rgba(61,107,152,0.15)] p-6 min-h-[480px] flex flex-col relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-sm dark:text-white/40 text-foreground/50 uppercase tracking-widest">
              Вынік
            </h2>
            {blocks.length > 0 && (
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={copy}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg dark:text-white/40 text-foreground/50 dark:hover:text-white hover:text-foreground dark:hover:bg-white/5 hover:bg-foreground/[0.05] transition-all"
                  title="Скапіяваць тэкст"
                >
                  {copied ? (
                    <Check className="h-4 w-4 dark:text-[#4ade80] text-[#3D6B98]" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </motion.button>
                <motion.button
                  onClick={save}
                  whileTap={{ scale: 0.9 }}
                  disabled={saved}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    saved
                      ? "dark:text-[#4ade80] dark:bg-[rgba(74,222,128,0.1)] dark:border-[rgba(74,222,128,0.3)] text-[#3D6B98] bg-[rgba(61,107,152,0.10)] border border-[rgba(61,107,152,0.35)]"
                      : "dark:text-white/50 text-foreground/60 border dark:border-white/10 border-border dark:hover:text-white hover:text-foreground dark:hover:border-white/20 hover:border-foreground/30"
                  )}
                >
                  <BookmarkPlus className="h-3.5 w-3.5" />
                  {saved ? "Захавана!" : "Захаваць у кабінет"}
                </motion.button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full gap-4 py-16"
                >
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full border-2 dark:border-[rgba(74,222,128,0.2)] dark:border-t-[#4ade80] border-[rgba(61,107,152,0.2)] border-t-[#3D6B98] animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto h-5 w-5 dark:text-[#4ade80] text-[#3D6B98] opacity-60" />
                  </div>
                  <p className="text-sm dark:text-white/40 text-foreground/50 font-mono animate-pulse">
                    Ткём словы з паветра…
                  </p>
                </motion.div>
              )}

              {!loading && !blocks.length && !error && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full py-16 gap-3 text-center"
                >
                  <div className="h-16 w-16 rounded-full dark:border-[rgba(74,222,128,0.15)] border-[rgba(61,107,152,0.2)] border flex items-center justify-center">
                    <Sparkles className="h-7 w-7 dark:text-white/20 text-foreground/25" />
                  </div>
                  <p className="dark:text-white/25 text-foreground/40 text-sm max-w-xs">
                    Выберыце жанр, настрой і тэму, каб актываваць генератар
                  </p>
                </motion.div>
              )}

              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center h-full py-16"
                >
                  <p className="text-red-400/70 text-sm">{error}</p>
                </motion.div>
              )}

              {blocks.length > 0 && !loading && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="flex items-center gap-3 text-[10px] font-mono dark:text-white/20 text-foreground/30 uppercase tracking-widest mb-4">
                    <span className="flex items-center gap-1">
                      <GripVertical className="h-3 w-3" />
                      Перацягнуць
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Pencil className="h-2.5 w-2.5" />
                      Двойны клік для рэдагавання
                    </span>
                  </p>

                  <Reorder.Group
                    axis="y"
                    values={blocks}
                    onReorder={setBlocks}
                    as="div"
                    className="space-y-4"
                  >
                    {blocks.map((block, idx) => (
                      <BlockItem
                        key={block.id}
                        block={block}
                        onEdit={() => openEdit(idx)}
                      />
                    ))}
                  </Reorder.Group>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Block editor overlay */}
          <AnimatePresence>
            {editingIdx !== null && (
              <motion.div
                key="editor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.18 }}
                className="absolute inset-0 rounded-2xl z-20 flex flex-col p-6 gap-4 dark:bg-[#0a100e]/96 bg-white/96 backdrop-blur-lg"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-xs dark:text-white/40 text-foreground/50 uppercase tracking-widest">
                    Рэдагаванне блока
                  </h3>
                  <button
                    onClick={cancelEdit}
                    className="p-1.5 rounded-lg dark:hover:bg-white/10 hover:bg-foreground/[0.07] transition-colors"
                  >
                    <X className="h-4 w-4 dark:text-white/40 text-foreground/50" />
                  </button>
                </div>

                {/* Block type selector */}
                <div>
                  <p className="text-xs font-mono dark:text-white/40 text-foreground/50 uppercase tracking-widest mb-2.5">
                    Тып блока
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {BLOCK_TYPES.map((type) => {
                      const colorEntry = TAG_COLORS[type] ?? {
                        text: "dark:text-white/40 text-foreground/50",
                        border: "dark:border-white/10 border-border",
                      };
                      const isActive = editTag === type;
                      return (
                        <button
                          key={type}
                          onClick={() => setEditTag(type)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-mono border transition-all",
                            isActive
                              ? cn(
                                  "dark:bg-white/[0.08] bg-foreground/[0.06]",
                                  colorEntry.text,
                                  colorEntry.border
                                )
                              : "dark:border-white/[0.08] border-border/60 dark:text-white/25 text-foreground/35 dark:hover:border-white/20 dark:hover:text-white/50 hover:text-foreground/60 hover:border-foreground/20"
                          )}
                        >
                          [{type}]
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Text editor */}
                <div className="flex-1 flex flex-col gap-2 min-h-0">
                  <p className="text-xs font-mono dark:text-white/40 text-foreground/50 uppercase tracking-widest">
                    Тэкст
                  </p>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className={cn(
                      "flex-1 w-full min-h-0 dark:bg-white/[0.04] bg-foreground/[0.03] rounded-xl",
                      "border dark:border-white/10 border-border",
                      "px-3 py-2.5 text-sm dark:text-white/80 text-foreground leading-relaxed",
                      "resize-none focus:outline-none focus:ring-0",
                      "dark:focus:border-[rgba(74,222,128,0.35)] focus:border-[rgba(61,107,152,0.4)]",
                      "transition-colors",
                      "placeholder:dark:text-white/20 placeholder:text-foreground/30"
                    )}
                    placeholder="Увядзіце тэкст блока…"
                    autoFocus
                    spellCheck={false}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={saveEdit}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold dark:bg-[#4ade80] dark:text-[#0b1210] bg-[#3D6B98] text-white transition-all dark:hover:shadow-[0_0_20px_rgba(74,222,128,0.4)] hover:shadow-[0_0_20px_rgba(61,107,152,0.3)]"
                  >
                    Захаваць
                  </motion.button>
                  <button
                    onClick={cancelEdit}
                    className="px-5 py-2.5 rounded-xl text-sm dark:text-white/50 text-foreground/60 border dark:border-white/10 border-border dark:hover:border-white/20 hover:border-foreground/30 transition-colors"
                  >
                    Адмяніць
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
