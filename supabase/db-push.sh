#!/usr/bin/env bash
# Прымяніць непрымянія міграцыі да аддаленай БД Supabase.
#
# Варыянты:
#   1) Аднаразова: `supabase login`, потым `supabase link` (інтэрактыўна).
#   2) Лакальна без login: у `.env.local` дадайце:
#        SUPABASE_DB_PASSWORD   — Settings → Database → Database password
#      Рэф праекта бярэцца з NEXT_PUBLIC_SUPABASE_URL (паддамен) або SPEU_SUPABASE_PROJECT_REF.
#
# Запуск з караня Next (speu/):
#   ./supabase/db-push.sh
#   ./supabase/db-push.sh --dry-run

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

run_sb() {
  if command -v supabase >/dev/null 2>&1; then
    supabase "$@"
  else
    npx -y supabase@latest "$@"
  fi
}

if [ -f "$ROOT/.env.local" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env.local"
  set +a
fi

REF="${SPEU_SUPABASE_PROJECT_REF:-}"
if [ -z "$REF" ] && [ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ]; then
  u="${NEXT_PUBLIC_SUPABASE_URL#https://}"
  u="${u#http://}"
  REF="${u%%.*}"
fi

PASS="${SUPABASE_DB_PASSWORD:-}"

log() { echo "$*" >&2; }

push_db() {
  if [ -n "$PASS" ]; then
    run_sb db push -p "$PASS" "$@"
  else
    run_sb db push "$@"
  fi
}

TMPLOG="$(mktemp)"
trap 'rm -f "$TMPLOG"' EXIT

set +o pipefail
push_db "$@" 2>&1 | tee "$TMPLOG"
code="${PIPESTATUS[0]}"
set -o pipefail

if [ "$code" -eq 0 ]; then
  exit 0
fi

needs_link=0
if grep -qE 'project ref|Cannot find project' "$TMPLOG" 2>/dev/null; then
  needs_link=1
fi

if [ "$needs_link" -eq 1 ] && [ -n "$REF" ] && [ -n "$PASS" ]; then
  log "==> Звязваю праект $REF …"
  run_sb link --project-ref "$REF" -p "$PASS" --yes
  set +o pipefail
  push_db "$@" 2>&1 | tee "$TMPLOG"
  exit "${PIPESTATUS[0]}"
fi

if [ "$needs_link" -eq 1 ]; then
  log ""
  log "Няма supabase link. Дадайце ў .env.local:"
  log "  SUPABASE_DB_PASSWORD=<Database password: Dashboard → Settings → Database>"
  log "Рэф праекта: з NEXT_PUBLIC_SUPABASE_URL або SPEU_SUPABASE_PROJECT_REF."
  log "Або: npx supabase login && npx supabase link"
  log ""
fi

exit "$code"
