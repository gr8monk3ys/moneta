import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Pool, PoolClient } from 'pg';

// Serializes concurrent runners (e.g. parallel serverless cold starts) — the
// second runner waits, then sees every migration already applied.
const MIGRATION_ADVISORY_LOCK_KEY = 0x6d6f6e65; // "mone"

export class MigrationRunner {
  public constructor(
    private readonly pool: Pool,
    private readonly migrationsDir: string
  ) {}

  public async run(): Promise<void> {
    // All statements must share one connection: transaction control and
    // advisory locks are per-session, and pool.query() may use a different
    // connection per call.
    const client = await this.pool.connect();
    try {
      await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_ADVISORY_LOCK_KEY]);
      try {
        await this.ensureMigrationsTable(client);
        const files = await this.getSqlFiles();

        for (const file of files) {
          const alreadyApplied = await this.hasAppliedMigration(client, file);
          if (alreadyApplied) {
            continue;
          }

          const sql = await readFile(path.join(this.migrationsDir, file), 'utf8');
          await client.query('BEGIN');
          try {
            await client.query(sql);
            await client.query(
              'INSERT INTO schema_migrations (version, applied_at) VALUES ($1, NOW())',
              [file]
            );
            await client.query('COMMIT');
          } catch (error) {
            await client.query('ROLLBACK');
            throw error;
          }
        }
      } finally {
        await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_ADVISORY_LOCK_KEY]);
      }
    } finally {
      client.release();
    }
  }

  private async ensureMigrationsTable(client: PoolClient): Promise<void> {
    await client.query(`
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

  private async hasAppliedMigration(client: PoolClient, version: string): Promise<boolean> {
    const result = await client.query(
      'SELECT version FROM schema_migrations WHERE version = $1 LIMIT 1',
      [version]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
