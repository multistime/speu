import fs from "node:fs";
import path from "node:path";

const MIGRATION_NAME = /^(\d{14})_[a-z0-9._-]+\.sql$/i;

export type MigrationFileInfo = {
  name: string;
  version: string;
  relativePath: string;
};

export type MigrationAdvice = {
  migrationDir: string;
  files: MigrationFileInfo[];
  /** Блокирующие для «чистой» истории миграций */
  criticalIssues: string[];
  warnings: string[];
  /** Что делать на практике */
  recommendations: string[];
  preferredWorkflow: string;
};

function readMigrationDir(repoRoot: string): string {
  return path.join(repoRoot, "supabase", "migrations");
}

export function listMigrations(repoRoot: string): MigrationFileInfo[] {
  const dir = readMigrationDir(repoRoot);
  if (!fs.existsSync(dir)) {
    return [];
  }
  const names = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const out: MigrationFileInfo[] = [];
  for (const name of names) {
    const m = name.match(MIGRATION_NAME);
    if (!m) {
      continue;
    }
    out.push({
      name,
      version: m[1],
      relativePath: path.join("supabase/migrations", name),
    });
  }
  return out;
}

function analyzeSqlContent(filePath: string): {
  nonIdempotentCreates: boolean;
  hasDestructiveBulk: boolean;
} {
  const raw = fs.readFileSync(filePath, "utf8");
  const lower = raw.toLowerCase();

  const createTable = /\bcreate\s+table\s+(?!if\s+not\s+exists)/i.test(raw);
  const createIndex = /\bcreate\s+(unique\s+)?index\s+(?!if\s+not\s+exists)/i.test(
    raw,
  );

  const nonIdempotentCreates = createTable || createIndex;

  const hasDestructiveBulk =
    /\btruncate\s+/i.test(lower) || /\bdrop\s+schema\s+/i.test(lower);

  return { nonIdempotentCreates, hasDestructiveBulk };
}

/**
 * Анализ репозитория Speu: имена миграций, дубликаты версий, эвристики по SQL.
 * Не ходит в Supabase — только файловая система.
 */
export function analyzeSpeuMigrations(repoRoot: string): MigrationAdvice {
  const migrationDir = readMigrationDir(repoRoot);
  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (!fs.existsSync(migrationDir)) {
    criticalIssues.push(`Каталог не найден: ${migrationDir}`);
    return {
      migrationDir,
      files: [],
      criticalIssues,
      warnings,
      recommendations: [
        "Создайте `supabase/migrations` и добавьте миграции через `supabase migration new`.",
      ],
      preferredWorkflow: "supabase migration new + db push",
    };
  }

  const allSql = fs
    .readdirSync(migrationDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const name of allSql) {
    if (!MIGRATION_NAME.test(name)) {
      criticalIssues.push(
        `Некорректное имя миграции (ожидается 14_цифр_snake_case.sql): ${name}`,
      );
    }
  }

  const files = listMigrations(repoRoot);

  const byVersion = new Map<string, string[]>();
  for (const f of files) {
    const list = byVersion.get(f.version) ?? [];
    list.push(f.name);
    byVersion.set(f.version, list);
  }

  for (const [ver, names] of byVersion) {
    if (names.length > 1) {
      warnings.push(
        `Одинаковый timestamp ${ver} у файлов: ${names.join(", ")}. Лучше уникальный префикс времени на файл — проще порядок и аудит.`,
      );
    }
  }

  const sortedNames = [...files.map((f) => f.name)].sort();
  const listedNames = files.map((f) => f.name);
  if (sortedNames.join("\0") !== listedNames.join("\0")) {
    warnings.push(
      "Порядок миграций по имени не совпадает с лексикографической сортировкой — проверьте, что Supabase применит их в ожидаемом порядке.",
    );
  }

  for (const f of files) {
    const full = path.join(migrationDir, f.name);
    const { nonIdempotentCreates, hasDestructiveBulk } = analyzeSqlContent(full);
    if (nonIdempotentCreates) {
      warnings.push(
        `${f.name}: есть CREATE без IF NOT EXISTS — повторный прогон на той же БД может упасть.`,
      );
    }
    if (hasDestructiveBulk) {
      warnings.push(
        `${f.name}: есть TRUNCATE или DROP SCHEMA — на проде применяйте только осознанно.`,
      );
    }
  }

  const manualRoot = path.join(repoRoot, "supabase");
  const manualHelpers = [
    "apply-speu-extensions-manual.sql",
    "migration-check-speu-extensions.sql",
    "migration-check-speu-extensions-data.sql",
  ].filter((n) => fs.existsSync(path.join(manualRoot, n)));

  if (manualHelpers.length > 0) {
    recommendations.push(
      `Ручные скрипты в supabase/: ${manualHelpers.join(", ")} — не подхватываются CLI автоматически. Порядок: сначала проверки/расширения (если нужны), затем миграции из migrations/.`,
    );
  }

  recommendations.push(
    "Оптимальный путь для связанного проекта: `supabase link` → локально проверить `supabase db reset` (или тестовую ветку) → на прод/стейдж `supabase db push` (или CI с тем же набором файлов).",
  );
  recommendations.push(
    "Уже применённые на проде файлы в `migrations/` не редактировать — только новые файлы с новым timestamp; правки схемы = новая миграция.",
  );
  recommendations.push(
    "Если прод жил без таблицы `supabase_migrations.schema_migrations`, сделайте baseline (документация Supabase) или однократно синхронизируйте историю, иначе `db push` может конфликтовать.",
  );

  const preferredWorkflow =
    criticalIssues.length > 0
      ? "Сначала исправьте критические замечания по именам файлов, затем supabase link + db push."
      : warnings.some((w) => w.includes("Одинаковый timestamp"))
        ? "Предпочтительно: уникальные префиксы времени, затем `supabase db push` на целевую БД."
        : "`supabase db push` (или migration up в CI) по текущему каталогу migrations/.";

  return {
    migrationDir,
    files,
    criticalIssues,
    warnings,
    recommendations,
    preferredWorkflow,
  };
}

export function formatMigrationReport(advice: MigrationAdvice): string {
  const lines: string[] = [
    "=== Speu: рекомендации по миграциям БД ===",
    `Каталог: ${advice.migrationDir}`,
    `Файлов миграций: ${advice.files.length}`,
    "",
    "Предпочтительный workflow:",
    `  ${advice.preferredWorkflow}`,
    "",
  ];

  if (advice.criticalIssues.length) {
    lines.push("Критично:");
    advice.criticalIssues.forEach((s) => lines.push(`  - ${s}`));
    lines.push("");
  }

  if (advice.warnings.length) {
    lines.push("Предупреждения:");
    advice.warnings.forEach((s) => lines.push(`  - ${s}`));
    lines.push("");
  }

  lines.push("Рекомендации:");
  advice.recommendations.forEach((s) => lines.push(`  • ${s}`));
  lines.push("");
  lines.push("Список миграций (порядок применения по имени):");
  advice.files.forEach((f) => lines.push(`  ${f.name}`));

  return lines.join("\n");
}
