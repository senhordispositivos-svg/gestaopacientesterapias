import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

export const hasSqlConfig = Boolean(
  (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') ||
  (process.env.POSTGRES_URL && process.env.POSTGRES_URL.trim() !== '') ||
  (process.env.SQL_HOST && process.env.SQL_DB_NAME)
);

// Function to create or retrieve the connection pool.
export const createPool = () => {
  if (!hasSqlConfig) {
    return null;
  }

  if (!global._postgresPool) {
    const connectionString = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').trim();

    if (connectionString) {
      const isSupabaseOrRemote = 
        connectionString.includes('supabase') || 
        connectionString.includes('pooler.supabase.com') ||
        connectionString.includes('sslmode=') ||
        !connectionString.includes('localhost');

      global._postgresPool = new Pool({
        connectionString,
        ssl: isSupabaseOrRemote ? { rejectUnauthorized: false } : undefined,
        max: 10,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        keepAlive: true,
      });
    } else if (process.env.SQL_HOST && process.env.SQL_DB_NAME) {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 10,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
      });
    }

    // Prevent unhandled pool-level errors from crashing the application
    if (global._postgresPool) {
      global._postgresPool.on('error', (err) => {
        console.warn('[PostgreSQL Pool] Warning on idle connection client:', err?.message || err);
      });
    }
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
export const pool = createPool();

// Initialize Drizzle with the pool and schema if pool is available.
export const db = pool ? drizzle(pool, { schema }) : (null as unknown as ReturnType<typeof drizzle>);

