import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { MigrationRunner } from '../src/migrations.js';

// The runner must do all work on ONE pooled client: transaction control and
// advisory locks are per-session, so pool.query() would scatter them across
// connections. The mock mirrors that contract.
function buildPoolMock() {
  const client = {
    query: vi.fn(),
    release: vi.fn()
  };
  return {
    client,
    pool: {
      query: vi.fn(),
      connect: vi.fn().mockResolvedValue(client)
    }
  };
}

function queryCalls(client: { query: ReturnType<typeof vi.fn> }): string[] {
  return client.query.mock.calls.map((call) => String(call[0]));
}

describe('MigrationRunner', () => {
  it('applies only unapplied sql migrations in sorted order', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'moneta-migrations-'));
    await writeFile(path.join(dir, '002_b.sql'), 'SELECT 2;');
    await writeFile(path.join(dir, '001_a.sql'), 'SELECT 1;');

    const { pool, client } = buildPoolMock();
    client.query
      .mockResolvedValueOnce({}) // advisory lock
      .mockResolvedValueOnce({}) // ensure table
      .mockResolvedValueOnce({ rowCount: 0 }) // 001 not applied
      .mockResolvedValueOnce({}) // begin
      .mockResolvedValueOnce({}) // sql
      .mockResolvedValueOnce({}) // insert schema_migrations
      .mockResolvedValueOnce({}) // commit
      .mockResolvedValueOnce({ rowCount: 1 }) // 002 already applied
      .mockResolvedValueOnce({}); // advisory unlock

    const runner = new MigrationRunner(pool as never, dir);
    await runner.run();

    const calls = queryCalls(client);
    expect(calls.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS schema_migrations'))).toBe(true);
    expect(calls.some((sql) => sql === 'BEGIN')).toBe(true);
    expect(calls.some((sql) => sql === 'COMMIT')).toBe(true);
    expect(calls.some((sql) => sql.includes('SELECT 1;'))).toBe(true);
    expect(calls.some((sql) => sql.includes('SELECT 2;'))).toBe(false);
    expect(calls.some((sql) => sql.includes('pg_advisory_lock'))).toBe(true);
    expect(calls.some((sql) => sql.includes('pg_advisory_unlock'))).toBe(true);
    expect(pool.query).not.toHaveBeenCalled();
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it('rolls back, unlocks, and rethrows when migration query fails', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'moneta-migrations-'));
    await writeFile(path.join(dir, '001_fail.sql'), 'SELECT fail;');

    const { pool, client } = buildPoolMock();
    client.query
      .mockResolvedValueOnce({}) // advisory lock
      .mockResolvedValueOnce({}) // ensure table
      .mockResolvedValueOnce({ rowCount: 0 }) // not applied
      .mockResolvedValueOnce({}) // begin
      .mockRejectedValueOnce(new Error('boom')) // sql fails
      .mockResolvedValueOnce({}) // rollback
      .mockResolvedValueOnce({}); // advisory unlock

    const runner = new MigrationRunner(pool as never, dir);

    await expect(runner.run()).rejects.toThrow('boom');

    const calls = queryCalls(client);
    expect(calls.includes('ROLLBACK')).toBe(true);
    expect(calls.some((sql) => sql.includes('pg_advisory_unlock'))).toBe(true);
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});
