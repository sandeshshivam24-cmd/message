import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err);
  });
}

export const getPool = () => pool;

export const query = (text, params) => {
  if (!pool) {
    throw new Error('Database pool not initialized. Check DATABASE_URL environment variable.');
  }
  return pool.query(text, params);
};

export const initializeDatabase = async () => {
  if (!pool) return false;

  try {
    const client = await pool.connect();
    console.log('✅ Supabase PostgreSQL connected successfully!');

    // Read and execute schema migration file (CREATE TABLE -> ALTER TABLE -> CREATE INDEX)
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(sql);
      console.log('✅ PostgreSQL Base Schema & Migrations executed successfully!');
    }

    client.release();
    return true;
  } catch (err) {
    console.error('❌ Supabase PostgreSQL connection error:', err.message);
    throw err;
  }
};
