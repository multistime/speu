#!/usr/bin/env bash
# Деплой Speu на Vercel: staging, prod (promote) или оба подряд.
# Запуск из корня репозитория: npm run deploy:staging | deploy:prod | deploy:all
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

STAGING_ALIAS="staging-speu.vercel.app"
STATE_DIR="$ROOT/.vercel"
STATE_FILE="$STATE_DIR/last-staging-deployment-url"

run_vercel() {
  if [[ -n "${VERCEL_BIN:-}" ]]; then
    # shellcheck disable=SC2086
    $VERCEL_BIN "$@"
  elif command -v vercel >/dev/null 2>&1; then
    vercel "$@"
  else
    npx -y vercel@latest "$@"
  fi
}

usage() {
  cat <<'EOF'
Использование:
  scripts/deploy.sh staging          — pull preview, deploy (сборка на Vercel), alias на staging-speu.vercel.app
  scripts/deploy.sh prod [URL]       — promote в production (URL или последний staging)
  scripts/deploy.sh all              — staging, затем promote того же превью

Сборка идёт на серверах Vercel (без локального vercel build), чтобы деплой работал из подпапки монорепо.

Переменные:
  VERCEL_BIN   — переопределить команду CLI (по умолчанию: vercel в PATH или npx vercel@latest)

Примеры:
  npm run deploy:staging
  npm run deploy:prod -- https://speu-xxxxx-multistimes-projects.vercel.app
  npm run deploy:all
EOF
}

extract_preview_url() {
  local log_file="$1"
  local url
  url="$(grep -oE 'https://speu-[^ ]+\.vercel\.app' "$log_file" | tail -1 || true)"
  if [[ -z "$url" ]]; then
    echo "Не удалось извлечь URL превью из вывода vercel deploy. Смотрите лог выше." >&2
    exit 1
  fi
  printf '%s' "$url"
}

cmd_staging() {
  echo "==> Vercel pull (preview)…"
  run_vercel pull --yes --environment=preview
  local log
  log="$(mktemp)"
  echo "==> Vercel deploy (облачная сборка)…"
  run_vercel deploy --yes 2>&1 | tee "$log"
  local url
  url="$(extract_preview_url "$log")"
  rm -f "$log"
  mkdir -p "$STATE_DIR"
  printf '%s\n' "$url" >"$STATE_FILE"
  echo "==> Сохранён URL: $STATE_FILE"
  echo "==> Alias → ${STAGING_ALIAS}…"
  run_vercel alias set "$url" "$STAGING_ALIAS" || true
  echo "==> Staging: $url"
  echo "    Публичный алиас: https://$STAGING_ALIAS"
}

cmd_prod() {
  local url="${1:-}"
  if [[ -z "$url" ]]; then
    if [[ -f "$STATE_FILE" ]]; then
      url="$(tr -d '\r\n' <"$STATE_FILE" | head -1)"
    fi
  fi
  if [[ -z "$url" ]]; then
    echo "Нет URL для promote. Сначала выполните: scripts/deploy.sh staging" >&2
    echo "Или передайте URL: scripts/deploy.sh prod https://speu-….vercel.app" >&2
    exit 1
  fi
  echo "==> Promote в production: $url"
  printf 'y\n' | run_vercel promote "$url"
  echo "==> Готово (проверьте https://speu.vercel.app и метаданные деплоя)."
}

cmd_all() {
  cmd_staging
  local url
  url="$(tr -d '\r\n' <"$STATE_FILE" | head -1)"
  cmd_prod "$url"
}

main() {
  local sub="${1:-}"
  case "$sub" in
    staging) cmd_staging ;;
    prod) shift || true; cmd_prod "${1:-}" ;;
    all) cmd_all ;;
    -h | --help | help | "") usage; [[ -n "$sub" ]] || exit 0 ;;
    *)
      echo "Неизвестная команда: $sub" >&2
      usage >&2
      exit 1
      ;;
  esac
}

main "$@"
