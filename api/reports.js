const express = require('express');
const router = express.Router();
const Report = require('../schemas/Report'); // Import the Report schema

// POST /api/reports - Create a new report
router.post('/', async (req, res) => {
  try {
    const { report_id, issueType, longitude, latitude, description, photoUri } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const report = new Report({
      report_id,
      issueType,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude], // GeoJSON format: [longitude, latitude]
      },
      description,
      photoUri,
    });

    await report.save();
    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (err) {
    console.error('Error saving report:', err.message);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});


// GET /api/reports/near - Fetch nearby reports
router.get('/near', async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 5000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const reports = await Report.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          distanceField: 'distance',
          maxDistance: parseInt(maxDistance),
          spherical: true,
        },
      },
    ]);

    res.status(200).json(reports);
  } catch (err) {
    console.error('Error fetching nearby reports:', err.message);
    res.status(500).json({ error: 'Failed to fetch nearby reports' });
  }
});

module.exports = router;
