# Handoff: светлая тема Speǔ — для верстальщика

## Цель

Светлая тема должна опираться на **зелёный лесной акцент** (`#35654D`, RGB `53, 101, 77`), согласованный с тёмной (sage `#7DBF9E`), **без** основного UI-синего (`#3D6B98` / `#4A7CB5`).

## Что уже сделано в репозитории (проверка по коммиту)

| Зона | Файл(ы) | Действие |
|------|---------|----------|
| Токены светлой темы | `src/app/globals.css` | `:root` — `primary`, `ring`, `input`, `secondary`, sidebar, `glass-border`; орнамент `body` (SVG data-URI); `.glow-primary` / `.glow-moss` / `.text-glow-*` (ветка без `.dark`); `::selection` |
| Дизайн-токены в `@theme` | `globals.css` | `--color-moss-deep`, `--color-moss-mid`; `--color-vasilok` — второстепенный синий, не primary UI |
| Hero + плеер | `HeroSection.tsx`, `AudioPlayer.tsx` | Ветка `!isDark`: accent / RGB / CTA |
| Топокарта (light) | `TopographicCanvas.tsx` | Контуры `rgb(53,101,77)` |
| Тиры / услуги | `SupportTiers.tsx`, `services/page.tsx` | Дефолт первого уровня — зелёный |
| Формы / генератор | `ServicesForm.tsx`, `LyricsGenerator.tsx` | Светлые `text-*` / `border-*` / кнопки — зелёный и `rgba(53,101,77,…)` |
| Админка примеров | `admin/support-tiers/page.tsx` | Placeholders hex / RGB |

## Чеклист приёмки (верстальщик)

- [ ] В светлой теме кнопки первого уровня, активный пункт навигации, ссылки-акценты — **зелёные**, не синие.
- [ ] Орнамент на фоне страницы (ромбы) — **зелёный** контур, читаемость фона не хуже прежнего.
- [ ] Фокус полей (`ring`) — зелёный оттенок.
- [ ] Тёмная тема **без регрессий** (primary остаётся sage, как до задачи).
- [ ] `npm run build` без ошибок.
- [ ] `npm run lint` без ошибок (warnings по проекту допустимы, если были до задачи).

## Опционально (бэкенд)

В seed-миграции Supabase у тира supporter могут остаться старые `#4A7CB5` / `74, 124, 181`. Если тиры тянутся из БД — отдельная миграция `UPDATE … accent_color, glow_rgb` под согласование с фронтом.

## Деплой (после merge в `main`)

1. Push в `main` → GitHub Actions **Deploy to Staging** (preview / staging URL в комментарии к коммиту или логах workflow).
2. Прод: в репозитории **Actions → Promote to Production** → `confirm: yes` (нужны секреты `VERCEL_TOKEN`, `VERCEL_ORG_ID`).

## Контрольные значения

- Primary (светлая): `#35654D`
- RGB для glow / rgba: `53, 101, 77`
- Фон: `#F6F2E8`, карточка: `#FEFCF3`
- Вторичный тёплый акцент (Купалле): `#BF7535` — не менять роль
