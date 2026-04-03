<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Дэплой Speu (Vercel + GitHub)

**Корань git-рэпазіторыя:** каталог `speu/` (`multistime/speu` на GitHub). Працаваць з `cd speu`; бацькоўскі `Speu/` без `.git`.

### Схема

1. **Пуш у `main`** — абавязковы; код на GitHub — крыніца праўды.
2. **Staging:** workflow [`.github/workflows/staging.yml`](.github/workflows/staging.yml) на кожны push (`vercel build` + `vercel deploy --prebuilt`, аліас `staging-speu.vercel.app` для `main`).
3. **Production:** workflow [`.github/workflows/promote-production.yml`](.github/workflows/promote-production.yml) — толькі ўручную (Actions → *Promote to Production* → `confirm` = `yes`). Без гэтага кроку дамен проду можа застацца на старым каміце.
4. **Адзін уваход для ручнога рэжыму (GitHub):** [`.github/workflows/manual-deploy.yml`](.github/workflows/manual-deploy.yml) — `target`: `staging` | `production` | `both`; для `production` / `both` — `confirm: yes`; для `production` можна паказаць `deployment_url` (інакш бярэцца першы `https://speu-*` з `vercel ls`, менш надзейна).
5. **Праверка праз Vercel MCP** (калі ўключаны плагін): `list_deployments` для `prj_saDxiOFBgbM0xXzfeDIYB7YYo1w6` / `team_GwG38eWYSvJL97bK46B27Gzg` (гл. [`.vercel/project.json`](.vercel/project.json)); у метаданых глядзі `githubCommitSha` і параўнай з `git rev-parse origin/main`.
6. Калі прод не абнавіўся пасля пуша: пусты каміт (`git commit --allow-empty -m "chore: trigger deploy"`) + push, зноў правер Actions і пры неабходнасці **Promote to Production**.

### Лакальна (адна каманда пад задачу)

З каталога `speu/` пасля `vercel login` (або з `VERCEL_BIN` / токенам як у CI):

| Задача | Каманда |
|--------|---------|
| Толькі staging | `npm run deploy:staging` |
| Толькі prod (promote) | `npm run deploy:prod` — бярэ URL апошняга **лакальнага** `deploy:staging` з `.vercel/last-staging-deployment-url`, або `npm run deploy:prod -- <URL>` |
| Staging, потым гэты ж билд у prod | `npm run deploy:all` |

Скрыпт: [`scripts/deploy.sh`](scripts/deploy.sh) (`staging` \| `prod [URL]` \| `all`, `-h`). Пераменная `VERCEL_BIN` — кастомная каманда CLI. `npm run deploy` — дапамога (`-h`).

Інструмент `deploy_to_vercel` у MCP не запускае CLI сам — не разлічваць на аўтаматычны прод ад яго адказу.

### GitHub Actions — сакрэты

У рэпазіторыі павінны быць: `VERCEL_TOKEN`, `VERCEL_ORG_ID` (`team_*`), **`VERCEL_PROJECT_ID`** (`prj_*` з лакальнага `.vercel/project.json` → `projectId`). Без `VERCEL_PROJECT_ID` у CI няма `.vercel/project.json` (каталог у `.gitignore`), і `vercel pull` часта падае. Environments: `staging`, `production` (для адабрэння promote пры неабходнасці).

### Калі агент робіць дэплой з машыны карыстальніка (Vercel CLI)

Патрэбна: `npx vercel@latest login` адзін раз (або токен у `VERCEL_TOKEN` для CI-падобнага запуску).

Пераважна: `npm run deploy:staging` / `deploy:all` (гл. [`scripts/deploy.sh`](scripts/deploy.sh)). Эквівалент уручную (як у [staging.yml](.github/workflows/staging.yml)):

```bash
npx vercel@latest pull --yes --environment=preview
npx vercel@latest build
PREVIEW_URL=$(npx vercel@latest deploy --prebuilt 2>&1 | tee /tmp/vd.log | grep -oE 'https://speu-[^ ]+\.vercel\.app' | tail -1)
npx vercel@latest alias set "$PREVIEW_URL" staging-speu.vercel.app
printf 'y\n' | npx vercel@latest promote "$PREVIEW_URL"
```

Калі `vercel promote` пытае пра «new deployment» з production env — гэта нармальна для preview-артыфакта; у метаданых прадакшн-дэплою павінен з’явіцца той жа `githubCommitSha`, што і лакальны `HEAD` пасля пуша.

### Альтэрнатыва: GitHub CLI

`brew install gh && gh auth login`, потым з машыны:

`gh workflow run "Manual deploy (Vercel)" --repo multistime/speu -f target=both -f confirm=yes`

Альбо толькі promote: `gh workflow run "Promote to Production" --repo multistime/speu -f confirm=yes -f deployment_url=`

(`deployment_url` пусты — скрыпт бярэ першы `https://speu-*` з `vercel ls`; надзейней перадаць URL са стэйджынг або з `manual-deploy` / лакальнага `deploy:staging`.)
