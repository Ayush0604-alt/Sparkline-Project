/**
 * Global error handler. Must be registered LAST, after every route and
 * the 404 handler. Express recognizes it as an error handler because it
 * takes 4 arguments (err, req, res, next).
 */
function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err);

  // Postgres-specific errors carry a `code` field (e.g. '23505' = unique
  // violation, '23502' = not-null violation). Surface a clean 400 instead
  // of leaking raw driver errors to the client.
  if (err.code && typeof err.code === 'string' && err.code.startsWith('23')) {
    return res.status(400).json({
      success: false,
      message: 'Database constraint violation',
      detail: err.detail || err.message,
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal server error' : err.message,
  });
}

module.exports = errorHandler;
