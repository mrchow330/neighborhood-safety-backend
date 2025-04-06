const express = require('express');
const router = express.Router();
const Report = require('../models/Report'); // Assuming you move the Report schema to a separate file

// API Route to Submit Reports
router.post('/', async (req, res) => {
  try {
    const report = new Report(req.body);
    await report.save();
    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

module.exports = router;
