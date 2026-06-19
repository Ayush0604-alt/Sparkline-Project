const express = require('express');
const router = express.Router();
const { validateReading } = require('../middleware/validateReading');
const {
  createReading,
  getLatestReadings,
  getReadingsByCrane,
} = require('../controllers/readingsController');

// IMPORTANT: /latest must be registered before /:craneId, otherwise
// Express will match "latest" as a craneId parameter.
router.get('/latest', getLatestReadings);
router.get('/:craneId', getReadingsByCrane);
router.post('/', validateReading, createReading);

module.exports = router;
