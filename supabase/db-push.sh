#!/usr/bin/env bash
# Прымяніць усе непрымянія міграцыі да звязанага аддаленага праекта.
#
# Умовы:
#   1. Усталяваны Supabase CLI: https://supabase.com/docs/guides/cli
#   2. У каталозе speu/ ёсць `supabase link` (або init + link)
#
# Запуск з караня праекта Next (там, дзе ляжыць supabase/):
#   chmod +x supabase/db-push.sh
#   ./supabase/db-push.sh

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase: каманда не знойдзена. Усталюй CLI: https://supabase.com/docs/guides/cli" >&2
  exit 1
fi

exec supabase db push "$@"
