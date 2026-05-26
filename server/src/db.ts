import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { config } from './config/env';

class DatabaseService {
  private static instance: Database | null = null;

  private constructor() {}

  public static async getInstance(): Promise<Database> {
    if (!DatabaseService.instance) {
      const dbPath = path.resolve(__dirname, '../../', config.databaseUrl);
      const dbDir = path.dirname(dbPath);

      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      DatabaseService.instance = await open({
        filename: dbPath,
        driver: sqlite3.Database,
      });

      await this.runMigrations(DatabaseService.instance);
      console.log('Database connected and migrated at', dbPath);
    }
    return DatabaseService.instance;
  }

  private static async runMigrations(db: Database) {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.applyMigration(
      db,
      '001_initial',
      `
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        title TEXT,
        model TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
      );
    `
    );

    const columns = await db.all('PRAGMA table_info(chat_history)');
    const hasSessionId = columns.some((col: { name: string }) => col.name === 'session_id');
    if (!hasSessionId) {
      console.log('Migrating chat_history: adding session_id column');
      await db.exec(
        'ALTER TABLE chat_history ADD COLUMN session_id TEXT REFERENCES chat_sessions(id)'
      );
    }
  }

  private static async applyMigration(db: Database, name: string, sql: string) {
    const migration = await db.get('SELECT * FROM migrations WHERE name = ?', [name]);
    if (!migration) {
      console.log(`Applying migration: ${name}`);
      await db.exec(sql);
      await db.run('INSERT INTO migrations (name) VALUES (?)', [name]);
    }
  }
}

export const getDb = () => DatabaseService.getInstance();
