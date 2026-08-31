import { Pool, PoolClient, QueryResultRow } from 'pg';
import { config } from './config/env';
import { runMigrations } from './migrations/runner';

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

    await runMigrations(db);

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
}

export const getDb = () => DatabaseService.getInstance();
export const closeDb = () => DatabaseService.close();
