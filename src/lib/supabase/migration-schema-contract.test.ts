import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { listMigrations } from "./migration-advisor";

/**
 * Контракт: миграции в репозитории покрывают схему Speu, нужную приложению
 * (треки ↔ артысты, ролі listener/artist, радыё).
 * Не ходит в Supabase — только файлы.
 */
describe("migration schema contract", () => {
  const root = process.cwd();
  const migrationDir = path.join(root, "supabase", "migrations");

  it("имена миграций: уникальный timestamp, кроме известного дубликата в истории", () => {
    const files = listMigrations(root);
    const versions = files.map((f) => f.version);
    const freq = new Map<string, number>();
    for (const v of versions) {
      freq.set(v, (freq.get(v) ?? 0) + 1);
    }
    /** Уже прикладзеныя на старых БД; перайменаванне файла ламае schema_migrations. */
    const legacyDuplicateOk = new Set(["20260424100000"]);
    for (const [v, n] of freq) {
      if (n === 1) continue;
      if (legacyDuplicateOk.has(v) && n === 2) continue;
      expect.fail(`Migration timestamp ${v} used ${n} times (expected unique or legacy pair)`);
    }
  });

  it("содержит объекты для track_artists, user_id на artists, ролі listener/artist, play_on_radio", () => {
    const names = fs.readdirSync(migrationDir).filter((f) => f.endsWith(".sql")).sort();
    const combined = names
      .map((n) => fs.readFileSync(path.join(migrationDir, n), "utf8"))
      .join("\n");

    expect(combined).toMatch(/create\s+table\s+if\s+not\s+exists\s+speu\.track_artists/i);
    expect(combined).toMatch(
      /alter\s+table\s+speu\.artists\s+add\s+column\s+if\s+not\s+exists\s+user_id/i,
    );
    expect(combined).toMatch(/\(\s*'listener'\s*,/);
    expect(combined).toMatch(/\(\s*'artist'\s*,/);
    expect(combined).toMatch(/play_on_radio/i);
  });

  it("файл ролей listener/artist существует как отдельная миграция", () => {
    const names = fs.readdirSync(migrationDir);
    expect(names.some((n) => n.includes("user_listener_artist_roles"))).toBe(true);
  });
});
