import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.ts';

export let isCloudSqlConnected = false;

export const createPool = () => {
  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER || process.env.SQL_ADMIN_USER,
    password: process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 3500, // Reduced connection timeout to prevent hanging long requests
  });
};

const pool = createPool();

pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

export const db = drizzle(pool, { schema });

// Asynchronous connection validator
export const validateCloudSqlConnection = async () => {
  console.log('[DB] Launching background Cloud SQL connection status check...');
  try {
    const testPool = createPool();
    const testClient = await testPool.connect();
    await testClient.query("SELECT 1");
    testClient.release();
    await testPool.end();
    isCloudSqlConnected = true;
    console.log('[DB] SUCCESS: Cloud SQL database instance is reachable and healthy!');
  } catch (error: any) {
    isCloudSqlConnected = false;
    console.warn('[DB] WARNING: Cloud SQL not available. Activating fallback Local File DB storage system.', error.message);
  }
};

// Execute background check asynchronously on resource loading
validateCloudSqlConnection().catch((e) => {
  console.error("[DB] Unexpected background check error:", e);
});
