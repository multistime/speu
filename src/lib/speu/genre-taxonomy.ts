/**
 * Canonical genre tags for release submissions (stored as stable codes in DB).
 * UI labels: Belarusian primary for Speu cabinet.
 */

export const GENRE_TAXONOMY_VERSION = "1";

export const MAX_GENRES_PER_TRACK = 5;
export const MIN_GENRES_PER_TRACK = 1;

export type GenreEntry = {
  code: string;
  labelBe: string;
  labelRu: string;
  labelEn: string;
  /** Normalized lookup keys (lowercase, trimmed). */
  aliases?: string[];
};

export const GENRE_ENTRIES: GenreEntry[] = [
  { code: "hip_hop", labelBe: "Хіп-хоп", labelRu: "Хип-хоп", labelEn: "Hip-Hop", aliases: ["hiphop", "hip-hop", "хіп-хоп", "хип-хоп", "рэп", "rap"] },
  { code: "trap", labelBe: "Трэп", labelRu: "Трэп", labelEn: "Trap", aliases: ["трэп", "трап"] },
  { code: "drill", labelBe: "Дрыль", labelRu: "Дрилл", labelEn: "Drill", aliases: ["дрилл", "дрыль"] },
  { code: "rnb", labelBe: "R&B / соул", labelRu: "R&B / соул", labelEn: "R&B / Soul", aliases: ["r&b", "rnb", "соул", "soul"] },
  { code: "pop", labelBe: "Поп", labelRu: "Поп", labelEn: "Pop", aliases: ["поп", "popular"] },
  { code: "indie_pop", labelBe: "Інды-поп", labelRu: "Инди-поп", labelEn: "Indie Pop", aliases: ["инди-поп", "інды-поп"] },
  { code: "electronic", labelBe: "Электроніка", labelRu: "Электроника", labelEn: "Electronic", aliases: ["электроника", "электроніка", "edm"] },
  { code: "house", labelBe: "Хаус", labelRu: "Хаус", labelEn: "House", aliases: ["хаус"] },
  { code: "techno", labelBe: "Тэхна", labelRu: "Техно", labelEn: "Techno", aliases: ["техно", "тэхна"] },
  { code: "dnb", labelBe: "Drum & bass", labelRu: "Drum & bass", labelEn: "Drum & Bass", aliases: ["drum and bass", "днб", "jungle"] },
  { code: "ambient", labelBe: "Эмбіент", labelRu: "Эмбиент", labelEn: "Ambient", aliases: ["эмбіент", "эмбиент"] },
  { code: "rock", labelBe: "Рок", labelRu: "Рок", labelEn: "Rock", aliases: ["рок"] },
  { code: "alternative", labelBe: "Альтэрнатыва", labelRu: "Альтернатива", labelEn: "Alternative", aliases: ["альтэрнатыва", "альтернатива", "alt"] },
  { code: "metal", labelBe: "Метал", labelRu: "Метал", labelEn: "Metal", aliases: ["метал", "metal"] },
  { code: "punk", labelBe: "Панк", labelRu: "Панк", labelEn: "Punk", aliases: ["панк"] },
  { code: "indie_rock", labelBe: "Інды-рок", labelRu: "Инди-рок", labelEn: "Indie Rock", aliases: ["инди-рок", "інды-рок"] },
  { code: "folk", labelBe: "Фолк", labelRu: "Фолк", labelEn: "Folk", aliases: ["фолк", "folk"] },
  { code: "country", labelBe: "Кантры", labelRu: "Кантри", labelEn: "Country", aliases: ["кантри", "кантры"] },
  { code: "jazz", labelBe: "Джаз", labelRu: "Джаз", labelEn: "Jazz", aliases: ["джаз"] },
  { code: "blues", labelBe: "Блюз", labelRu: "Блюз", labelEn: "Blues", aliases: ["блюз"] },
  { code: "classical", labelBe: "Класіка", labelRu: "Классика", labelEn: "Classical", aliases: ["класіка", "классика"] },
  { code: "reggae", labelBe: "Рэггі", labelRu: "Регги", labelEn: "Reggae", aliases: ["регги", "рэггі"] },
  { code: "latin", labelBe: "Лацінская", labelRu: "Латинская", labelEn: "Latin", aliases: ["латынская", "латинская", "latin"] },
  { code: "afrobeats", labelBe: "Afrobeats", labelRu: "Afrobeats", labelEn: "Afrobeats", aliases: ["афробіт", "афробит"] },
  { code: "singer_songwriter", labelBe: "Аўтарская песня", labelRu: "Авторская песня", labelEn: "Singer-Songwriter", aliases: ["singer songwriter", "акустыка", "акустика", "acoustic"] },
  { code: "experimental", labelBe: "Эксперымент", labelRu: "Эксперимент", labelEn: "Experimental", aliases: ["эксперымент", "эксперимент", "авангард"] },
  { code: "soundtrack", labelBe: "Саўндтрэк", labelRu: "Саундтрек", labelEn: "Soundtrack", aliases: ["саўндтрэк", "саундтрек", "ost"] },
  { code: "lofi", labelBe: "Lo-fi", labelRu: "Lo-fi", labelEn: "Lo-Fi", aliases: ["лофай", "лофи", "lo fi"] },
  { code: "hyperpop", labelBe: "Гіперпоп", labelRu: "Гиперпоп", labelEn: "Hyperpop", aliases: ["hyper pop", "гіперпоп", "гиперпоп"] },
  { code: "belarusian", labelBe: "Беларуская", labelRu: "Белорусская", labelEn: "Belarusian", aliases: ["беларусь", "беларуская", "белорусская", "by"] },
  { code: "ukrainian", labelBe: "Украінская", labelRu: "Украинская", labelEn: "Ukrainian", aliases: ["украінская", "украинская", "ua"] },
  { code: "polish", labelBe: "Польская", labelRu: "Польская", labelEn: "Polish", aliases: ["польская", "polish"] },
  { code: "podcast", labelBe: "Падкаст (жанр)", labelRu: "Подкаст (жанр)", labelEn: "Podcast (genre)", aliases: ["падкаст", "подкаст"] },
  { code: "spoken_word", labelBe: "Словам", labelRu: "Словом", labelEn: "Spoken Word", aliases: ["spoken word", "паэзія", "поэзия", "вершы"] },
];

const codes = new Set(GENRE_ENTRIES.map((e) => e.code));

const aliasToCode = new Map<string, string>();
for (const e of GENRE_ENTRIES) {
  const register = (raw: string) => {
    const k = normalizeKey(raw);
    if (k && !aliasToCode.has(k)) aliasToCode.set(k, e.code);
  };
  register(e.code.replace(/_/g, " "));
  register(e.code.replace(/_/g, "-"));
  register(e.labelBe);
  register(e.labelRu);
  register(e.labelEn);
  for (const a of e.aliases ?? []) register(a);
}

function normalizeKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalize user-typed token to canonical genre code, or null if unknown. */
export function resolveGenreToken(input: string): string | null {
  const k = normalizeKey(input);
  if (!k) return null;
  if (codes.has(k)) return k;
  const fromAlias = aliasToCode.get(k);
  if (fromAlias) return fromAlias;
  const underscored = k.replace(/\s+/g, "_");
  if (codes.has(underscored)) return underscored;
  return null;
}

export function isAllowedGenreCode(code: string): boolean {
  return codes.has(code);
}

export function getGenreLabelBe(code: string): string {
  const e = GENRE_ENTRIES.find((x) => x.code === code);
  return e?.labelBe ?? code.replace(/_/g, " ");
}

/** Dedupe, preserve order, cap length. */
export function normalizeGenreCodeList(codesIn: string[], max = MAX_GENRES_PER_TRACK): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const c of codesIn) {
    const t = c.trim();
    if (!t || !codes.has(t) || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

export function validateGenresForSubmit(genres: string[] | null | undefined): string | null {
  const list = normalizeGenreCodeList(genres ?? []);
  if (list.length < MIN_GENRES_PER_TRACK) {
    return `Дадайце ад ${MIN_GENRES_PER_TRACK} да ${MAX_GENRES_PER_TRACK} жанраў зі спісу.`;
  }
  return null;
}

export function filterGenreSuggestions(query: string, limit = 12): GenreEntry[] {
  const q = normalizeKey(query);
  if (!q) return GENRE_ENTRIES.slice(0, limit);
  const scored: { e: GenreEntry; score: number }[] = [];
  for (const e of GENRE_ENTRIES) {
    const be = normalizeKey(e.labelBe);
    const en = normalizeKey(e.labelEn);
    const code = e.code.replace(/_/g, " ");
    let score = 0;
    if (be.startsWith(q) || en.startsWith(q) || code.startsWith(q)) score = 3;
    else if (be.includes(q) || en.includes(q) || code.includes(q)) score = 2;
    else {
      const hitAlias = (e.aliases ?? []).some((a) => normalizeKey(a).includes(q));
      if (hitAlias) score = 1;
    }
    if (score > 0) scored.push({ e, score });
  }
  scored.sort((a, b) => b.score - a.score || a.e.labelBe.localeCompare(b.e.labelBe, "be"));
  return scored.slice(0, limit).map((x) => x.e);
}
