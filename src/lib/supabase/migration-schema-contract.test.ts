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

  it("имена миграций дают уникальный timestamp (порядок db push однозначен)", () => {
    const files = listMigrations(root);
    const versions = files.map((f) => f.version);
    const unique = new Set(versions);
    expect(unique.size).toBe(versions.length);
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
