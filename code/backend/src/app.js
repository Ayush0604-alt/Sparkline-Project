const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/config');
const readingsRoutes = require('./routes/readingsRoutes');
const alertsRoutes = require('./routes/alertsRoutes');
const notFoundHandler = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ------------------------------------------------------------------
// Global middleware
// ------------------------------------------------------------------
// CORS_ORIGIN can be a single origin or a comma-separated list, so the
// same deployed backend can accept requests from both the local dev
// server (http://localhost:5173) and the deployed frontend at the same
// time — useful while testing a Render deploy without breaking local dev.
const allowedOrigins = config.corsOrigin.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, server-to-server health checks)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
  })
);
app.use(express.json());
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// ------------------------------------------------------------------
// Health check (useful for Render/uptime checks)
// ------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Crane monitoring API is running' });
});

// ------------------------------------------------------------------
// Routes
// ------------------------------------------------------------------
app.use('/api/readings', readingsRoutes);
app.use('/api/alerts', alertsRoutes);

// ------------------------------------------------------------------
// 404 + error handling (order matters: 404 first, error handler last)
// ------------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;