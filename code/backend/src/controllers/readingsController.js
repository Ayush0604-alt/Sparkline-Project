const { query } = require('../db/pool');
const { evaluateAndCreateAlert } = require('../utils/alertEngine');

/**
 * POST /api/readings
 * Ingests a single telemetry reading, stores it, and checks it against
 * alert thresholds.
 */
async function createReading(req, res, next) {
  try {
    const { crane_id, ts, load_kg, motor_temp_c, vibration_mm_s, status } = req.body;

    await query(
      `INSERT INTO readings (crane_id, ts, load_kg, motor_temp_c, vibration_mm_s, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (crane_id, ts) DO NOTHING`,
      [crane_id, ts, load_kg, motor_temp_c, vibration_mm_s, status]
    );

    // Alert check runs regardless of whether the insert was a duplicate —
    // the alert engine has its own duplicate guard keyed on (crane_id, reading_ts).
    await evaluateAndCreateAlert({ crane_id, ts, motor_temp_c });

    res.status(201).json({
      success: true,
      message: 'Reading stored successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/readings/latest
 * Returns the most recent reading for each distinct crane.
 *
 * Implementation note: DISTINCT ON (crane_id) combined with
 * ORDER BY crane_id, ts DESC is the idiomatic Postgres pattern for
 * "latest row per group" — it's a single index-friendly scan rather
 * than a correlated subquery or window function, and reads cleanly
 * for an interview walkthrough.
 */
async function getLatestReadings(req, res, next) {
  try {
    const result = await query(
      `SELECT DISTINCT ON (crane_id)
              crane_id, ts, load_kg, motor_temp_c, vibration_mm_s, status
       FROM readings
       ORDER BY crane_id, ts DESC`
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/readings/:craneId?start=&end=
 * Returns readings for a single crane, optionally bounded by a time range.
 */
async function getReadingsByCrane(req, res, next) {
  try {
    const { craneId } = req.params;
    const { start, end } = req.query;

    const conditions = ['crane_id = $1'];
    const params = [craneId];

    if (start) {
      params.push(start);
      conditions.push(`ts >= $${params.length}`);
    }

    if (end) {
      params.push(end);
      conditions.push(`ts <= $${params.length}`);
    }

    const sql = `
      SELECT crane_id, ts, load_kg, motor_temp_c, vibration_mm_s, status
      FROM readings
      WHERE ${conditions.join(' AND ')}
      ORDER BY ts ASC
    `;

    const result = await query(sql, params);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createReading, getLatestReadings, getReadingsByCrane };
