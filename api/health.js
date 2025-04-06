const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Health Check Endpoint
router.get('/', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const isRunning = dbState === 1;
    const statusMessage = isRunning ? 'Server is running' : 'Server is down';

    res.status(200).json({
      status: statusMessage,
      database: isRunning ? 'Connected' : 'Disconnected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to retrieve health status',
      error: err.message,
    });
  }
});

module.exports = router;