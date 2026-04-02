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
4. **Праверка праз Vercel MCP** (калі ўключаны плагін): `list_deployments` для `prj_saDxiOFBgbM0xXzfeDIYB7YYo1w6` / `team_GwG38eWYSvJL97bK46B27Gzg` (гл. [`.vercel/project.json`](.vercel/project.json)); у метаданых глядзі `githubCommitSha` і параўнай з `git rev-parse origin/main`.
5. Калі прод не абнавіўся пасля пуша: пусты каміт (`git commit --allow-empty -m "chore: trigger deploy"`) + push, зноў правер Actions і пры неабходнасці **Promote to Production**.

Інструмент `deploy_to_vercel` у MCP не запускае CLI сам — не разлічваць на аўтаматычны прод ад яго адказу.

### GitHub Actions — сакрэты

У рэпазіторыі павінны быць: `VERCEL_TOKEN`, `VERCEL_ORG_ID` (звычайна `team_*` з `.vercel/project.json`). Environments: `staging`, `production` (для адабрэння promote пры неабходнасці).

### Калі агент робіць дэплой з машыны карыстальніка (Vercel CLI)

Патрэбна: `npx vercel@latest login` адзін раз (або токен у `VERCEL_TOKEN` для CI-падобнага запуску).

З `speu/` (як у [staging.yml](.github/workflows/staging.yml)):

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

`gh workflow run "Promote to Production" --repo multistime/speu -f confirm=yes -f deployment_url=`

(`deployment_url` пусты — скрыпт у workflow сам бярэ URL з `vercel ls`; надзейней перадаць URL са стэйджынг-job у GitHub Actions.)
