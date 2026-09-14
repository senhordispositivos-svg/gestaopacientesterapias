import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _primaryPostgresPool: Pool | undefined;
  var _secondaryPostgresPool: Pool | undefined;
}

export const hasCloudSql = Boolean(process.env.SQL_HOST && process.env.SQL_DB_NAME);

export const hasSqlConfig = Boolean(
  hasCloudSql ||
  (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') ||
  (process.env.POSTGRES_URL && process.env.POSTGRES_URL.trim() !== '')
);

export const createPrimaryPool = (): Pool | null => {
  if (!hasSqlConfig) {
    return null;
  }

  if (!global._primaryPostgresPool) {
    if (hasCloudSql) {
      console.log('[PostgreSQL] Conectando primariamente ao Cloud SQL compartilhado (Google AI Studio)...');
      global._primaryPostgresPool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 10,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
      });
    } else {
      const connectionString = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').trim();
      const isRemote = connectionString.includes('supabase') || !connectionString.includes('localhost');
      global._primaryPostgresPool = new Pool({
        connectionString,
        ssl: isRemote ? { rejectUnauthorized: false } : undefined,
        max: 10,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        keepAlive: true,
      });
    }

    if (global._primaryPostgresPool) {
      global._primaryPostgresPool.on('error', (err) => {
        console.warn('[PostgreSQL Pool Primário] Aviso em conexão ociosa:', err?.message || err);
      });
    }
  }

  return global._primaryPostgresPool;
};

export const createSecondaryPool = (): Pool | null => {
  if (hasCloudSql && (process.env.DATABASE_URL || process.env.POSTGRES_URL)) {
    if (!global._secondaryPostgresPool) {
      const connectionString = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').trim();
      if (connectionString) {
        const isRemote = connectionString.includes('supabase') || !connectionString.includes('localhost');
        global._secondaryPostgresPool = new Pool({
          connectionString,
          ssl: isRemote ? { rejectUnauthorized: false } : undefined,
          max: 5,
          connectionTimeoutMillis: 8000,
          idleTimeoutMillis: 30000,
          keepAlive: true,
        });

        global._secondaryPostgresPool.on('error', (err) => {
          console.warn('[PostgreSQL Pool Espelho] Aviso:', err?.message || err);
        });
      }
    }
    return global._secondaryPostgresPool;
  }
  return null;
};

const rawPrimaryPool = createPrimaryPool();
const rawSecondaryPool = createSecondaryPool();

// Smart pool proxy that executes on primary and mirrors write operations to secondary
export const pool: Pool = rawPrimaryPool
  ? (new Proxy(rawPrimaryPool, {
      get(target, prop, receiver) {
        if (prop === 'query') {
          return function (...args: any[]) {
            const queryArg = args[0];
            const queryText = typeof queryArg === 'string' ? queryArg : queryArg?.text;
            const isWrite = queryText && /^\s*(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)/i.test(queryText);

            if (isWrite && rawSecondaryPool) {
              try {
                rawSecondaryPool.query.apply(rawSecondaryPool, args as any).catch((err: any) => {
                  console.warn('[PostgreSQL Espelho Supabase] Aviso:', err?.message || err);
                });
              } catch (_) {}
            }

            return Reflect.apply(target.query, target, args);
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    }) as unknown as Pool)
  : (null as unknown as Pool);

export const db = pool ? drizzle(pool, { schema }) : (null as unknown as ReturnType<typeof drizzle>);


