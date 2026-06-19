/**
 * Seed script.
 *
 * 1. Reads readings_seed.json (~2.6k readings across 3 cranes)
 * 2. Bulk-inserts them into `readings`, skipping duplicates
 * 3. Evaluates every inserted reading against the alert threshold and
 *    inserts rows into `alerts`, skipping duplicates
 *
 * Safe to re-run: both inserts rely on ON CONFLICT DO NOTHING against
 * unique indexes (readings: crane_id+ts, alerts: crane_id+reading_ts),
 * so running `npm run seed` twice will not create duplicate rows.
 *
 * Usage: npm run seed
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const SEED_FILE = path.join(__dirname, 'readings_seed.json');
const ALERT_TEMP_THRESHOLD_C = Number(process.env.ALERT_TEMP_THRESHOLD_C) || 80;

// Insert in batches to keep each query statement reasonably sized and to
// give visible progress for a ~2,600-row file rather than one giant
// multi-thousand-parameter statement.
const BATCH_SIZE = 200;

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Builds a parameterized multi-row INSERT for a batch of readings.
 * e.g. for 3 rows: VALUES ($1,$2,$3,$4,$5,$6), ($7,$8,...), ($13,...)
 */
function buildReadingsInsert(batch) {
  const columns = ['crane_id', 'ts', 'load_kg', 'motor_temp_c', 'vibration_mm_s', 'status'];
  const values = [];
  const placeholders = batch.map((reading, rowIndex) => {
    const rowPlaceholders = columns.map((col, colIndex) => {
      values.push(reading[col]);
      return `$${rowIndex * columns.length + colIndex + 1}`;
    });
    return `(${rowPlaceholders.join(', ')})`;
  });

  const sql = `
    INSERT INTO readings (${columns.join(', ')})
    VALUES ${placeholders.join(', ')}
    ON CONFLICT (crane_id, ts) DO NOTHING
  `;

  return { sql, values };
}

function buildAlertsInsert(batch) {
  const columns = ['crane_id', 'motor_temp_c', 'message', 'reading_ts'];
  const values = [];
  const placeholders = batch.map((alert, rowIndex) => {
    const rowPlaceholders = columns.map((col, colIndex) => {
      values.push(alert[col]);
      return `$${rowIndex * columns.length + colIndex + 1}`;
    });
    return `(${rowPlaceholders.join(', ')})`;
  });

  const sql = `
    INSERT INTO alerts (${columns.join(', ')})
    VALUES ${placeholders.join(', ')}
    ON CONFLICT (crane_id, reading_ts) DO NOTHING
  `;

  return { sql, values };
}

function validateRecord(record, index) {
  const required = ['crane_id', 'ts', 'load_kg', 'motor_temp_c', 'vibration_mm_s', 'status'];
  for (const field of required) {
    if (record[field] === undefined || record[field] === null) {
      throw new Error(`Record at index ${index} is missing required field "${field}"`);
    }
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Copy .env.example to .env first.');
    process.exit(1);
  }

  if (!fs.existsSync(SEED_FILE)) {
    console.error(`Seed file not found at ${SEED_FILE}`);
    process.exit(1);
  }

  console.log('Reading seed file...');
  const raw = fs.readFileSync(SEED_FILE, 'utf8');
  const readings = JSON.parse(raw);

  if (!Array.isArray(readings) || readings.length === 0) {
    console.error('Seed file is empty or not a JSON array.');
    process.exit(1);
  }

  readings.forEach(validateRecord);
  console.log(`Loaded ${readings.length} readings from seed file.`);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // ---- Insert readings in batches ----
    console.log(`Inserting readings in batches of ${BATCH_SIZE}...`);
    const readingBatches = chunk(readings, BATCH_SIZE);
    let insertedCount = 0;

    for (let i = 0; i < readingBatches.length; i++) {
      const batch = readingBatches[i];
      const { sql, values } = buildReadingsInsert(batch);
      const result = await pool.query(sql, values);
      insertedCount += result.rowCount;
      process.stdout.write(`  Batch ${i + 1}/${readingBatches.length} (${result.rowCount} new rows)\r\n`);
    }

    console.log(`Readings insert complete. ${insertedCount} new rows inserted (duplicates skipped).`);

    // ---- Generate alerts for readings above threshold ----
    console.log(`Evaluating alerts (motor_temp_c > ${ALERT_TEMP_THRESHOLD_C}°C)...`);
    const breaches = readings.filter((r) => r.motor_temp_c > ALERT_TEMP_THRESHOLD_C);
    console.log(`Found ${breaches.length} readings exceeding the threshold.`);

    let alertCount = 0;
    if (breaches.length > 0) {
      const alertRows = breaches.map((r) => ({
        crane_id: r.crane_id,
        motor_temp_c: r.motor_temp_c,
        message: `ALERT: ${r.crane_id} motor temp ${r.motor_temp_c.toFixed(1)}°C exceeds threshold`,
        reading_ts: r.ts,
      }));

      const alertBatches = chunk(alertRows, BATCH_SIZE);
      for (const batch of alertBatches) {
        const { sql, values } = buildAlertsInsert(batch);
        const result = await pool.query(sql, values);
        alertCount += result.rowCount;
      }

      // Log each alert message individually, as required by the spec.
      alertRows.forEach((a) => console.log(a.message));
    }

    console.log(`Alerts insert complete. ${alertCount} new alerts created (duplicates skipped).`);
    console.log('Seeding finished successfully.');
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
