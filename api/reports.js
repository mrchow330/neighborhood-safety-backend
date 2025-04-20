const express = require('express');
const router = express.Router();
const Report = require('../schemas/Report'); // Import the Report schema

// POST /api/reports - Create a new report
router.post('/', async (req, res) => {
  try {
    const { report_id, issueType, location, description, photoUri, userId } = req.body;
    // Validate that location is provided and in the correct format
    if (!location || !location.coordinates || location.coordinates.length !== 2) {
      return res.status(400).json({ error: 'Location with valid coordinates is required' });
    }

    const [longitude, latitude] = location.coordinates; // Extract longitude and latitude

    const report = new Report({
      report_id,
      issueType,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude], // GeoJSON format: [longitude, latitude]
      },
      description,
      photoUri,
      userId,
    });

    await report.save();
    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (err) {
    console.error('Error saving report:', err.message);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});


// GET /api/reports - Fetch all reports
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find(); // Fetch all reports from the database
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});


// DELETE /api/reports/:id - Delete a specific report
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedReport = await Report.findByIdAndDelete(id);

    if (!deletedReport) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
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

// PATCH /api/reports/:id/status - Update the status of a report
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['Submitted', 'Under Review', 'Reviewed', 'In Progress', 'Resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updatedReport = await Report.findByIdAndUpdate(
      id,
      { status },
      { new: true } // Return the updated document
    );

    if (!updatedReport) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.status(200).json({ message: 'Status updated successfully', report: updatedReport });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
