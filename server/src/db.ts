import { Pool, PoolClient, QueryResultRow } from 'pg';
import { config } from './config/env';

export interface DbExecutor {
  run(sql: string, params?: unknown[]): Promise<void>;
  all<T extends QueryResultRow = QueryResultRow>(sql: string, params?: unknown[]): Promise<T[]>;
  get<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: unknown[]
  ): Promise<T | undefined>;
}

export interface Db extends DbExecutor {
  transaction<T>(work: (tx: DbExecutor) => Promise<T>): Promise<T>;
}

type Queryable = Pick<PoolClient, 'query'>;

const executorOver = (source: Queryable): DbExecutor => ({
  async run(sql, params) {
    await source.query(sql, params);
  },
  async all(sql, params) {
    const result = await source.query(sql, params);
    return result.rows;
  },
  async get(sql, params) {
    const result = await source.query(sql, params);
    return result.rows[0];
  },
});

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
      ...executorOver(pool),
      async transaction(work) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const result = await work(executorOver(client));
          await client.query('COMMIT');
          return result;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
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

    // Sessions predating this migration have no owner, so they stop being listed.
    // That is the point: until now every visitor could read every other visitor's chat.
    await this.applyMigration(
      db,
      '003_session_ownership',
      `
      ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS owner_token TEXT;

      CREATE INDEX IF NOT EXISTS idx_chat_sessions_owner
        ON chat_sessions (owner_token, created_at DESC);

      ALTER TABLE chat_history DROP CONSTRAINT IF EXISTS chat_history_session_id_fkey;
      ALTER TABLE chat_history ADD CONSTRAINT chat_history_session_id_fkey
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE;

      ALTER TABLE chat_history DROP CONSTRAINT IF EXISTS chat_history_session_present;
      ALTER TABLE chat_history ADD CONSTRAINT chat_history_session_present
        CHECK (session_id IS NOT NULL) NOT VALID;

      CREATE INDEX IF NOT EXISTS idx_chat_logs_created ON chat_logs (created_at);
    `
    );
  }

  private static async applyMigration(db: Db, name: string, sql: string) {
    const migration = await db.get('SELECT name FROM migrations WHERE name = $1', [name]);
    if (migration) {
      return;
    }

    console.log(`Applying migration: ${name}`);
    await db.transaction(async (tx) => {
      await tx.run(sql);
      await tx.run('INSERT INTO migrations (name) VALUES ($1)', [name]);
    });
  }
}

export const getDb = () => DatabaseService.getInstance();
export const closeDb = () => DatabaseService.close();
