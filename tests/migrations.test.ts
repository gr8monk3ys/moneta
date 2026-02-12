import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { MigrationRunner } from '../src/migrations.js';

function buildPoolMock() {
  return {
    query: vi.fn()
  };
}

describe('MigrationRunner', () => {
  it('applies only unapplied sql migrations in sorted order', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'moneta-migrations-'));
    await writeFile(path.join(dir, '002_b.sql'), 'SELECT 2;');
    await writeFile(path.join(dir, '001_a.sql'), 'SELECT 1;');

    const pool = buildPoolMock();
    pool.query
      .mockResolvedValueOnce({}) // ensure table
      .mockResolvedValueOnce({ rowCount: 0 }) // 001 not applied
      .mockResolvedValueOnce({}) // begin
      .mockResolvedValueOnce({}) // sql
      .mockResolvedValueOnce({}) // insert schema_migrations
      .mockResolvedValueOnce({}) // commit
      .mockResolvedValueOnce({ rowCount: 1 }); // 002 already applied

    const runner = new MigrationRunner(pool as never, dir);
    await runner.run();

    const calls = pool.query.mock.calls.map((call) => String(call[0]));
    expect(calls.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS schema_migrations'))).toBe(true);
    expect(calls.some((sql) => sql === 'BEGIN')).toBe(true);
    expect(calls.some((sql) => sql === 'COMMIT')).toBe(true);
    expect(calls.some((sql) => sql.includes('SELECT 1;'))).toBe(true);
    expect(calls.some((sql) => sql.includes('SELECT 2;'))).toBe(false);
  });

  it('rolls back and rethrows when migration query fails', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'moneta-migrations-'));
    await writeFile(path.join(dir, '001_fail.sql'), 'SELECT fail;');

    const pool = buildPoolMock();
    pool.query
      .mockResolvedValueOnce({}) // ensure table
      .mockResolvedValueOnce({ rowCount: 0 }) // not applied
      .mockResolvedValueOnce({}) // begin
      .mockRejectedValueOnce(new Error('boom')) // sql fails
      .mockResolvedValueOnce({}); // rollback

    const runner = new MigrationRunner(pool as never, dir);

    await expect(runner.run()).rejects.toThrow('boom');

    const calls = pool.query.mock.calls.map((call) => String(call[0]));
    expect(calls.includes('ROLLBACK')).toBe(true);
  });
});
