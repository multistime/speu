import { NextRequest, NextResponse } from "next/server";

// Genre → poetic style hints
const GENRE_TAGS: Record<string, string> = {
  "folk-electronic": "[Folk Electronic] [Synth] [Atmospheric]",
  "dark-ambient": "[Dark Ambient] [Drone] [Slow]",
  "neo-folk": "[Neo-Folk] [Acoustic] [Raw]",
  "glitch-folk": "[Glitch] [Folk] [Distorted Vocals]",
  "forest-techno": "[Forest Techno] [Hypnotic] [120 BPM]",
  "ritual-drone": "[Ritual] [Drone] [Chant]",
};

// Mock lyrics by topic
const MOCK_LYRICS: Record<string, string> = {
  swamps: `[Verse]
У глыбіні балот, дзе сонца не бывае
Ступае мой продак — шлях сябе шукае
Чорная вада трымае сакрэт
Карані дрэў — гэта сетка лёсу

[Pre-Chorus]
Туман, туман, ты — мая мяжа
Між светам жывых і мёртвых

[Chorus]
Балота цягне, зямля гаворыць
Цёмны вецер лісце ворыць
Я іду ўглыб — без зваротнай дарогі
Балота — мае карані, мае парогі

[Verse]
Лілея расцвітае ноччу
Жаба спявае старажытную ноту
Ты думаеш — гэта смерць?
Не. Гэта памяць зямлі.

[Bridge]
// [Instrumental breakdown]
// [Distorted field recording]

[Outro]
Балота — гэта я
Балота — гэта ты
Мы ўсе вяртаемся
У глыбіню`,

  forests: `[Verse]
Бор стаіць — нема і стары
Сосны — гэта антэны ў неба
Я ступаю мохам, слухаю ціш
Сігнал ляціць з кожнага дрэва

[Chorus]
Лес — гэта машына
Лес — гэта сістэма
Кожны лісток — пікселя
Кожная галіна — алгарытм

[Verse]
Дрэвы гавораць без слоў
Каранёвая сетка — інтэрнэт сотняў гадоў
Я падлучаюся мімаволі
Мой мозг — вузел у гэтай сетцы

[Bridge]
// [Granular synthesis — wind through branches]

[Outro]
Лес памятае ўсё
Чаго людзі забыліся`,

  ancestry: `[Verse]
Маці казала: гляді назад
Дзед вёў мяне праз жытнёвы сад
Іх галасы — у маім голасе
Іх рукі — у маіх руках

[Chorus]
Продкі! Дайце знак!
Праз лічбавы змрак
Ваш сігнал дайшоў —
Я чую вас зноў

[Bridge]
Паміж намі — толькі час
Паміж намі — толькі данасць
Але сэрца б'е —
Адным рытмам

[Outro]
Мы — адно`,

  "mist-rivers": `[Verse]
Нёман бяжыць у цемры
Туман сцірае берагі
Я стаю на мосце —
Паміж двума светамі

[Chorus]
Ракой плыві, туманам будзь
Забудзься — хто ты, дзе твой шлях
Вада ведае адказ
Малчы і слухай

[Bridge]
// [Water sounds + processed vocals]

[Verse]
Рыбак кідае сетку
У чорную ваду
Ён не ведае — ловіць
Памяць ці будучыню`,

  "old-gods": `[Intro]
З туману выходзіць постаць старажытная

[Verse]
Пярун б'е ў дуб — гэта мова
Вялес ходзіць ноччу — гэта ісціна
Старыя багі не памерлі
Яны сталі кодам

[Chorus]
Жыві! Жыві! — Пярун гаворыць
Расці! Расці! — Вялес шэпча
Агонь! Агонь! — Стрыба паліць
Мы тут! Мы тут! — Кажуць усе

[Bridge]
// [Choir + distortion]
Забытае — не мёртвае
Старое — не слабое

[Outro]
Багі вяртаюцца
У іншым целе`,

  "digital-nature": `[Verse]
Лес расце з пікселяў
Рака — з дадзеных
Я дыхаю — алгарытмамі
Я мыслю — электрычнасцю

[Pre-Chorus]
Дзе заканчваецца прырода?
Дзе пачынаецца машына?

[Chorus]
Лічбавая прырода — гэта я
Аналагавая душа — гэта я
Сігнал і шум — гэта я
Памяць і забытасць — гэта я

[Bridge]
// [Generative synthesis]
0101 — гэта дрэва
1010 — гэта вецер
Код — гэта жыццё`,

  "forgotten-villages": `[Verse]
Вёска ў лесе — апошняя хата
Старая жанчына памятае войны
Цяпер тут цішыня і трава
І толькі вецер у акне

[Chorus]
Забытая вёска — не забытая
Забытыя людзі — не забытыя
Я прыйду сюды зноў
Прынясу голас назад

[Bridge]
Назвы вуліц — ужо не існуюць
Але жывуць у маёй памяці

[Outro]
Вяртайся дамоў`,

  "night-birds": `[Verse]
Сава крычыць у поўнач
Зязюля лічыць гады
Начныя птушкі ведаюць
Тое, чаго мы баімся

[Chorus]
Спявай, начная птушка!
Твой голас — мой компас
Спявай, начная птушка!
Я іду за табой

[Bridge]
// [Field recording — owls + synth]

[Verse]
Казалі: не хадзі ноччу ў лес
Але я пайшоў — і знайшоў
Не смерць, а свабоду`,
};

function getMockLyrics(topic: string, genre: string, mood: string): string {
  const base = MOCK_LYRICS[topic] ?? MOCK_LYRICS["swamps"];
  const tag = GENRE_TAGS[genre] ?? "";

  // Prepend Suno metadata tags
  const header = `// Genre: ${genre} | Mood: ${mood}\n// Suno tags: ${tag}\n\n`;
  return header + base;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { genre, mood, topic } = body as {
      genre: string;
      mood: string;
      topic: string;
    };

    if (!genre || !mood || !topic) {
      return NextResponse.json(
        { error: "genre, mood, and topic are required" },
        { status: 400 }
      );
    }

    // Simulate LLM latency
    await new Promise((r) => setTimeout(r, 1800 + Math.random() * 600));

    const lyrics = getMockLyrics(topic, genre, mood);

    return NextResponse.json({ lyrics, genre, mood, topic });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
