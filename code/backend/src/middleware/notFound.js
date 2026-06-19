/**
 * Catches any request that didn't match a defined route.
 * Must be registered AFTER all real routes, BEFORE the error handler.
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = notFoundHandler;
