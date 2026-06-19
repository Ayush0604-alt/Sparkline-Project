/**
 * Database connection module.
 *
 * Creates a single shared `pg` Pool instance for the entire application.
 * Every query in the app should go through this pool rather than opening
 * ad-hoc connections, so we get connection reuse + bounded concurrency.
 */
const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  // Fail fast and loud — a missing connection string is a configuration
  // error we want to catch immediately, not three requests later.
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.'
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon requires SSL. `rejectUnauthorized: false` is the standard setting
  // for managed Postgres providers (Neon, Render, Heroku) whose certs aren't
  // always in Node's default trust store.
  ssl: { rejectUnauthorized: false },
  max: 10,                     // max simultaneous connections in the pool
  idleTimeoutMillis: 30000,    // close idle clients after 30s
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  // Catches errors on idle clients (e.g. network blip) so they don't
  // crash the whole process.
  console.error('Unexpected error on idle PG client:', err.message);
});

/**
 * Helper for one-off queries. Most controllers will use this directly.
 * @param {string} text - parameterized SQL
 * @param {Array} params - query parameters
 */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DB]', text.replace(/\s+/g, ' ').trim(), { duration: `${duration}ms`, rows: result.rowCount });
  }
  return result;
}

/**
 * Get a single client for transactional work (BEGIN/COMMIT/ROLLBACK).
 * Caller is responsible for releasing it.
 */
async function getClient() {
  return pool.connect();
}

module.exports = { pool, query, getClient };
