const app = require('./app');
const config = require('./config/config');
const { pool } = require('./db/pool');

async function start() {
  try {
    // Verify DB connectivity before accepting traffic — fail fast if
    // the connection string is wrong rather than letting the first
    // request discover it.
    await pool.query('SELECT 1');
    console.log('Connected to PostgreSQL (Neon)');

    app.listen(config.port, () => {
      console.log(`Crane monitoring API listening on port ${config.port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
