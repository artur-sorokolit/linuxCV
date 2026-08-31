import { describe, it, expect } from 'vitest';
import { loadMigrations } from './runner';

describe('loadMigrations', () => {
  const migrations = loadMigrations();

  it('finds the migrations shipped with the server', () => {
    expect(migrations.length).toBeGreaterThan(0);
  });

  it('orders them by their numeric prefix', () => {
    const names = migrations.map((m) => m.name);
    expect(names).toEqual([...names].sort());
  });

  it('names every migration after its file, with no extension', () => {
    migrations.forEach((migration) => expect(migration.name).toMatch(/^\d{3}_[a-z_]+$/));
  });

  it('gives every migration a checksum, so an edited one can be caught', () => {
    migrations.forEach((migration) => expect(migration.checksum).toMatch(/^[0-9a-f]{16}$/));
  });

  it('keeps the names the already applied ledger recorded', () => {
    expect(migrations.map((m) => m.name)).toEqual(
      expect.arrayContaining(['001_initial', '002_chat_logs', '003_session_ownership'])
    );
  });

  it('loads sql rather than empty files', () => {
    migrations.forEach((migration) => expect(migration.sql.trim().length).toBeGreaterThan(0));
  });
});
