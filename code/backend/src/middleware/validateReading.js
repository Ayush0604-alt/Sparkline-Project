/**
 * Validation middleware for POST /api/readings.
 *
 * We deliberately hand-roll this validation instead of pulling in a
 * schema library (Joi/Zod/etc.) — for a payload this small, an explicit
 * function is just as readable, has zero extra dependencies, and is
 * trivial to walk through in an interview.
 */

const VALID_STATUSES = ['IDLE', 'RUNNING', 'FAULT'];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidTimestamp(value) {
  if (!isNonEmptyString(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function validateReading(req, res, next) {
  const { crane_id, ts, load_kg, motor_temp_c, vibration_mm_s, status } = req.body;
  const errors = [];

  if (!isNonEmptyString(crane_id)) errors.push('crane_id is required and must be a non-empty string');
  if (!isValidTimestamp(ts)) errors.push('ts is required and must be a valid ISO timestamp');
  if (!isFiniteNumber(load_kg)) errors.push('load_kg is required and must be a number');
  if (!isFiniteNumber(motor_temp_c)) errors.push('motor_temp_c is required and must be a number');
  if (!isFiniteNumber(vibration_mm_s)) errors.push('vibration_mm_s is required and must be a number');
  if (!isNonEmptyString(status) || !VALID_STATUSES.includes(status.toUpperCase())) {
    errors.push(`status is required and must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Normalize status casing before it reaches the controller.
  req.body.status = status.toUpperCase();
  req.body.crane_id = crane_id.trim();

  next();
}

module.exports = { validateReading, VALID_STATUSES };
