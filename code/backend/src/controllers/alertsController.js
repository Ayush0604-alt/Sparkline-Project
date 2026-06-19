const { query } = require('../db/pool');

/**
 * GET /api/alerts
 * Returns all alerts, newest first. Supports optional filtering by
 * crane_id via ?crane_id=CR-101 (used by the frontend's search/filter
 * bonus feature).
 */
async function getAlerts(req, res, next) {
  try {
    const { crane_id } = req.query;

    let sql = `
      SELECT id, crane_id, motor_temp_c, message, reading_ts, created_at
      FROM alerts
    `;
    const params = [];

    if (crane_id) {
      params.push(crane_id);
      sql += ` WHERE crane_id = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAlerts };
