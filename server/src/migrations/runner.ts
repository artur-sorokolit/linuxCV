import { createHash } from 'crypto';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import type { Db } from '../db';

/**
 * Forward only, applied by filename order, one transaction each. There is no down
 * step on purpose: this database is small enough that a mistake is fixed by writing
 * the next migration, and an unused rollback path is a rollback path nobody tested.
 */
export interface Migration {
  name: string;
  sql: string;
  checksum: string;
}

/** Any constant works as long as every instance of this app agrees on it. */
const MIGRATION_LOCK_KEY = 4_815_162_342;

const checksumOf = (sql: string): string =>
  createHash('sha256').update(sql).digest('hex').slice(0, 16);

/** Filenames lead with a zero padded number, so lexical order is apply order. */
export const loadMigrations = (directory: string = __dirname): Migration[] =>
  readdirSync(directory)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => {
      const sql = readFileSync(join(directory, file), 'utf8');
      return { name: file.replace(/\.sql$/, ''), sql, checksum: checksumOf(sql) };
    });

/**
 * An applied migration is frozen. Editing one is silently ignored by a name-only
 * ledger, which is how two environments drift apart without anyone noticing.
 */
const verifyUnchanged = async (db: Db, migration: Migration): Promise<boolean> => {
  const applied = await db.get<{ checksum: string | null }>(
    'SELECT checksum FROM migrations WHERE name = $1',
    [migration.name]
  );
  if (!applied) {
    return false;
  }
  if (applied.checksum === null) {
    // Applied before checksums existed. Adopt what is on disk as the baseline.
    await db.run('UPDATE migrations SET checksum = $1 WHERE name = $2', [
      migration.checksum,
      migration.name,
    ]);
    return true;
  }
  if (applied.checksum !== migration.checksum) {
    throw new Error(
      `Migration ${migration.name} was edited after it was applied ` +
        `(recorded ${applied.checksum}, on disk ${migration.checksum}). ` +
        'Write a new migration instead of changing an old one.'
    );
  }
  return true;
};

const apply = async (db: Db, migration: Migration): Promise<void> => {
  console.log(`Applying migration: ${migration.name}`);
  await db.transaction(async (tx) => {
    await tx.run(migration.sql);
    await tx.run('INSERT INTO migrations (name, checksum) VALUES ($1, $2)', [
      migration.name,
      migration.checksum,
    ]);
  });
};

/**
 * Every instance runs this at boot, so the advisory lock is what keeps two of them
 * from applying the same migration at once. It is released before the function returns.
 */
export const runMigrations = async (db: Db, directory?: string): Promise<void> => {
  await db.run(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await db.run('ALTER TABLE migrations ADD COLUMN IF NOT EXISTS checksum TEXT');

  await db.run('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_KEY]);
  try {
    for (const migration of loadMigrations(directory)) {
      if (await verifyUnchanged(db, migration)) {
        continue;
      }
      await apply(db, migration);
    }
  } finally {
    await db.run('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_KEY]);
  }
};
