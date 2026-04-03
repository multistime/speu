import { describe, expect, it } from "vitest";
import {
  analyzeSpeuMigrations,
  formatMigrationReport,
  listMigrations,
} from "./migration-advisor";

describe("migration advisor", () => {
  it("находит миграции в репозитории", () => {
    const files = listMigrations(process.cwd());
    expect(files.length).toBeGreaterThan(0);
    expect(files[0]).toMatchObject({
      version: expect.stringMatching(/^\d{14}$/),
      name: expect.stringMatching(/\.sql$/),
    });
  });

  /**
   * Запуск: `npm run test:migrations` или `npm test -- migration-advisor`.
   * В stdout попадает отчёт с оптимальным workflow и списком замечаний.
   */
  it("печатает отчёт и предлагает оптимальный способ миграций", () => {
    const advice = analyzeSpeuMigrations(process.cwd());
    const report = formatMigrationReport(advice);

    console.info(`\n${report}\n`);

    expect(advice.preferredWorkflow.length).toBeGreaterThan(10);
    expect(advice.recommendations.length).toBeGreaterThan(0);

    expect(
      advice.criticalIssues,
      "исправьте имена файлов в migrations/ (14 цифр_timestamp_snake.sql)",
    ).toEqual([]);
  });
});
