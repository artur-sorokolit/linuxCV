import { Pool, QueryResultRow } from 'pg';
import { config } from './config/env';

// The services were written against the `sqlite` package's run/all/get API with
// `?` placeholders. This adapter keeps that surface over `pg` so they stay unchanged.
// The rewrite is positional only: a `?` inside a string literal would be mangled.
const toPositional = (sql: string): string => {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
};

export interface Db {
  run(sql: string, params?: unknown[]): Promise<void>;
  all<T extends QueryResultRow = QueryResultRow>(sql: string, params?: unknown[]): Promise<T[]>;
  get<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: unknown[]
  ): Promise<T | undefined>;
}

class DatabaseService {
  private static instance: Db | null = null;
  private static pool: Pool | null = null;

  public static async getInstance(): Promise<Db> {
    if (DatabaseService.instance) {
      return DatabaseService.instance;
    }

    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL is not configured');
    }

    const pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
      max: config.databasePoolMax,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle database client', err);
    });

    const db: Db = {
      async run(sql, params = []) {
        await pool.query(toPositional(sql), params);
      },
      async all(sql, params = []) {
        const result = await pool.query(toPositional(sql), params);
        return result.rows;
      },
      async get(sql, params = []) {
        const result = await pool.query(toPositional(sql), params);
        return result.rows[0];
      },
    };

    await this.runMigrations(db);

    DatabaseService.pool = pool;
    DatabaseService.instance = db;
    console.log('Database connected and migrated');
    return db;
  }

  public static async close(): Promise<void> {
    await DatabaseService.pool?.end();
    DatabaseService.pool = null;
    DatabaseService.instance = null;
  }

  private static async runMigrations(db: Db) {
    await db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await this.applyMigration(
      db,
      '001_initial',
      `
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        title TEXT,
        model TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        session_id TEXT REFERENCES chat_sessions(id),
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_chat_history_session
        ON chat_history (session_id, created_at);
    `
    );

    await this.applyMigration(
      db,
      '002_chat_logs',
      `
      CREATE TABLE IF NOT EXISTS chat_logs (
        id SERIAL PRIMARY KEY,
        session_id TEXT,
        ip TEXT,
        user_agent TEXT,
        model TEXT,
        used_model TEXT,
        message TEXT NOT NULL,
        reply TEXT,
        error TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    );
  }

  private static async applyMigration(db: Db, name: string, sql: string) {
    const migration = await db.get('SELECT name FROM migrations WHERE name = ?', [name]);
    if (!migration) {
      console.log(`Applying migration: ${name}`);
      await db.run(sql);
      await db.run('INSERT INTO migrations (name) VALUES (?)', [name]);
    }
  }
}

export const getDb = () => DatabaseService.getInstance();
export const closeDb = () => DatabaseService.close();
