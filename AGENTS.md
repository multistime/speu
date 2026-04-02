<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Дэплой Speu (Vercel + GitHub)

1. **Пуш у `main`** — абавязковы; код на GitHub — крыніца праўды.
2. **Staging:** workflow [`.github/workflows/staging.yml`](.github/workflows/staging.yml) на кожны push (`vercel build` + `vercel deploy --prebuilt`, аліас `staging-speu.vercel.app` для `main`).
3. **Production:** workflow [`.github/workflows/promote-production.yml`](.github/workflows/promote-production.yml) — толькі ўручную (Actions → *Promote to Production* → `confirm` = `yes`). Без гэтага кроку дамен проду можа застацца на старым каміце.
4. **Праверка праз Vercel MCP** (калі ўключаны плагін): `list_teams` → `list_projects` (праект `speu`) → `list_deployments`; у метаданых глядзі `githubCommitSha` і параўнай з `origin/main`.
5. Калі прод не абнавіўся пасля пуша: пусты каміт (`git commit --allow-empty -m "chore: trigger deploy"`) + push, зноў правер Actions і пры неабходнасці **Promote to Production**.

Інструмент `deploy_to_vercel` у MCP не запускае CLI сам — не разлічваць на аўтаматычны прод ад яго адказу.
