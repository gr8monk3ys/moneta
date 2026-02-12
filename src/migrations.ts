import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Pool } from 'pg';

export class MigrationRunner {
  public constructor(
    private readonly pool: Pool,
    private readonly migrationsDir: string
  ) {}

  public async run(): Promise<void> {
    await this.ensureMigrationsTable();
    const files = await this.getSqlFiles();

    for (const file of files) {
      const alreadyApplied = await this.hasAppliedMigration(file);
      if (alreadyApplied) {
        continue;
      }

      const sql = await readFile(path.join(this.migrationsDir, file), 'utf8');
      await this.pool.query('BEGIN');
      try {
        await this.pool.query(sql);
        await this.pool.query(
          'INSERT INTO schema_migrations (version, applied_at) VALUES ($1, NOW())',
          [file]
        );
        await this.pool.query('COMMIT');
      } catch (error) {
        await this.pool.query('ROLLBACK');
        throw error;
      }
    }
  }

  private async ensureMigrationsTable(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL
      );
    `);
  }

  private async getSqlFiles(): Promise<string[]> {
    const allFiles = await readdir(this.migrationsDir);
    return allFiles
      .filter((file) => file.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));
  }

  private async hasAppliedMigration(version: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT version FROM schema_migrations WHERE version = $1 LIMIT 1',
      [version]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
