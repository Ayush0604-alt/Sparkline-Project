/**
 * Runs schema.sql against the database configured in DATABASE_URL.
 * Safe to re-run — every statement in schema.sql uses
 * CREATE TABLE/INDEX IF NOT EXISTS.
 *
 * Usage: npm run db:init
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Copy .env.example to .env first.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Applying schema.sql to database...');
  await pool.query(schemaSql);
  console.log('Schema applied successfully: readings + alerts tables ready.');

  await pool.end();
}

main().catch((err) => {
  console.error('Failed to initialize database:', err.message);
  process.exit(1);
});
