const express = require('express');
const router = express.Router();
const Report = require('../schemas/Report'); 

// API Route to Submit Reports
router.post('/', async (req, res) => {
  try {
    const report = new Report(req.body);
    await report.save();
    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (err) {
    console.error('Error saving report:', err.message); // Log the error for debugging
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

module.exports = router;