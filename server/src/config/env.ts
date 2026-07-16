import dotenv from 'dotenv';
dotenv.config();

const parseList = (value?: string): string[] =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const config = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL,
  // Managed Postgres (Neon, Render, Supabase) requires TLS; a local server usually has none.
  databaseSsl: process.env.DATABASE_SSL !== 'false',
  databasePoolMax: Number(process.env.DATABASE_POOL_MAX || 5),
  corsOrigins: parseList(process.env.CORS_ORIGINS),
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  adminToken: process.env.ADMIN_TOKEN || 'secret_admin_123',
  env: process.env.NODE_ENV || 'development',
};
