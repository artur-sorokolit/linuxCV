import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const list = z
  .string()
  .default('')
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  );

const requiredInProduction = isProduction ? z.string().min(1) : z.string().min(1).optional();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: requiredInProduction,
  // Managed Postgres (Neon, Render, Supabase) requires TLS; a local server usually has none.
  DATABASE_SSL: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(5),
  // Fail closed: an unset origin list in production would otherwise accept every site.
  CORS_ORIGINS: isProduction ? list.refine((origins) => origins.length > 0) : list,
  OPENROUTER_API_KEY: requiredInProduction,
  GMAIL_USER: z.email().optional(),
  GMAIL_APP_PASSWORD: z.string().optional(),
  // Zero keeps every log forever, which is the behaviour this project started with.
  CHAT_LOG_RETENTION_DAYS: z.coerce.number().int().min(0).default(0),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n  ');
  throw new Error(`Invalid environment configuration:\n  ${details}`);
}

export const config = {
  port: parsed.data.PORT,
  env: parsed.data.NODE_ENV,
  databaseUrl: parsed.data.DATABASE_URL,
  databaseSsl: parsed.data.DATABASE_SSL,
  databasePoolMax: parsed.data.DATABASE_POOL_MAX,
  corsOrigins: parsed.data.CORS_ORIGINS,
  openrouterApiKey: parsed.data.OPENROUTER_API_KEY,
  gmailUser: parsed.data.GMAIL_USER,
  gmailAppPassword: parsed.data.GMAIL_APP_PASSWORD,
  chatLogRetentionDays: parsed.data.CHAT_LOG_RETENTION_DAYS,
};
