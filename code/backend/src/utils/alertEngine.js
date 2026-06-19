const { query } = require('../db/pool');
const config = require('../config/config');

/**
 * Evaluates a single reading against alert thresholds and, if breached,
 * inserts an alert row. Currently implements one rule:
 *
 *   motor_temp_c > ALERT_TEMP_THRESHOLD_C  -->  raise alert
 *
 * Centralizing this in one function means the live POST /api/readings
 * endpoint and the offline seed script share identical alerting logic —
 * there is exactly one place that defines "what counts as abnormal".
 *
 * Duplicate prevention: the `alerts` table has a UNIQUE index on
 * (crane_id, reading_ts). We rely on `ON CONFLICT DO NOTHING` rather than
 * a SELECT-then-INSERT check, which avoids a race condition between two
 * concurrent requests for the same reading.
 *
 * @param {object} reading - { crane_id, ts, motor_temp_c }
 * @returns {Promise<object|null>} the created alert row, or null if none was raised
 */
async function evaluateAndCreateAlert(reading) {
  const { crane_id, ts, motor_temp_c } = reading;

  if (motor_temp_c <= config.alertTempThresholdC) {
    return null;
  }

  const message = `ALERT: ${crane_id} motor temp ${motor_temp_c.toFixed(1)}°C exceeds threshold`;

  // Logged exactly in the format required by the assignment spec.
  console.log(message);

  const result = await query(
    `INSERT INTO alerts (crane_id, motor_temp_c, message, reading_ts)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (crane_id, reading_ts) DO NOTHING
     RETURNING *`,
    [crane_id, motor_temp_c, message, ts]
  );

  return result.rows[0] || null;
}

module.exports = { evaluateAndCreateAlert };
