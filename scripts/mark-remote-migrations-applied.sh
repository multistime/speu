#!/usr/bin/env bash
# Mark every file in supabase/migrations/*.sql as applied on the linked remote DB.
# Use once when the remote schema was built manually in SQL Editor and matches the repo.
# Requires: supabase login, supabase link --project-ref <ref>
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
if [[ -x ./node_modules/.bin/supabase ]]; then
  SUPABASE=./node_modules/.bin/supabase
elif command -v supabase >/dev/null 2>&1; then
  SUPABASE=supabase
else
  echo "Install CLI: npm install (adds supabase) or: npm i -g supabase" >&2
  exit 1
fi
shopt -s nullglob
files=(supabase/migrations/*.sql)
if [[ ${#files[@]} -eq 0 ]]; then
  echo "No files in supabase/migrations/" >&2
  exit 1
fi
for f in "${files[@]}"; do
  v=$(basename "$f" .sql)
  echo "→ migration repair ${v} --status applied"
  "$SUPABASE" migration repair "$v" --status applied
done
echo "Done. Check: $SUPABASE migration list"
