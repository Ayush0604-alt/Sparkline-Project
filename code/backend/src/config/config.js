require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  alertTempThresholdC: Number(process.env.ALERT_TEMP_THRESHOLD_C) || 80,
  nodeEnv: process.env.NODE_ENV || 'development',
};
