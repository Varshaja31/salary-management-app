import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  SERVICE_NAME: z.string().default('salary-backend-app'),
  SERVICE_VERSION: z.string().default('0.1.0'),

  // Database (SQLite)
  DB_DIALECT: z.enum(['sqlite']).default('sqlite'),
  DB_STORAGE: z.string().default(':memory:'),
  DB_LOGGING: z
    .union([z.boolean(), z.string()])
    .transform((v) => (typeof v === 'string' ? v === 'true' : v))
    .default(false),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error('Invalid environment configuration');
  }
  return parsed.data;
}

export const env = loadEnv();

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
