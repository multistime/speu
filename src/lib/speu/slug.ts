/**
 * Slug for public URLs: лацінка, лічбы, злучок; з назвы трэка/альбома.
 */

const CYR_TO_LAT: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "h",
  ґ: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  і: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ў: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

/** Транслітэрацыя назвы ў slug-сегмент (без гарантыі унікальнасці). */
export function slugifyTitle(title: string): string {
  const t = title.trim().toLowerCase();
  if (!t) return "item";

  let s = "";
  for (const ch of t) {
    s += CYR_TO_LAT[ch] ?? ch;
  }

  s = s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

  s = s
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  if (!s) return "item";
  return s.slice(0, 96);
}

/**
 * Slug з поля адмінкі (ручны ўвод). Пуста → скарыстаць аўтагенерацыю з назвы.
 * Тэкст праходзіць тыя ж правілы, што і slug з назвы (укл. кірыліца → лацінка).
 */
export function normalizeManualSlugInput(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (!t) return null;
  const s = slugifyTitle(t);
  return s === "item" && !/[a-z0-9]/i.test(t) ? null : s;
}
