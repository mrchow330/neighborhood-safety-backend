const express = require('express');
const router = express.Router();
const Report = require('../schemas/Report');
const User = require('../schemas/User');
const {sendStatusUpdateEmail} = require('../utils/email');

// POST /api/reports - Create a new report
router.post('/', async (req, res) => {
  try {
    const { report_id, userId, issueType, location, description, photoUri } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!location || !location.coordinates || location.coordinates.length !== 2) {
      return res.status(400).json({ error: 'Location with valid coordinates is required' });
    }

    const [longitude, latitude] = location.coordinates;

    const report = new Report({
      report_id,
      userId,
      issueType,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
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

// Route to get report by ID
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id); // Fetch report by ID from the database
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ message: 'Internal server error' });
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

    // Find the report and populate user information
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Update the report status
    report.status = status;
    await report.save();

    // Look up user email from the linked user_id
    const user = await User.findById(report.user_id);
    if (user && user.email) {
      await sendStatusUpdateEmail(user.email, report.report_id, status, user.first_name);
    }

    res.status(200).json({ message: 'Status updated and user notified', report });
  } catch (error) {
    console.error('Error updating status and sending email:', error);
    res.status(500).json({ error: 'Failed to update status and notify user' });
  }
});

// PATCH /api/reports/bulk-update-status
router.patch('/bulk-update-status', async (req, res) => {
  try {
    const updates = req.body.updates; // [{ id, status }, ...]

    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Invalid updates format' });
    }

    const results = await Promise.all(updates.map(async ({ id, status }) => {
      const updatedReport = await Report.findByIdAndUpdate(id, { status }, { new: true });

      if (updatedReport) {
        const user = await User.findById(updatedReport.userId);
        if (user && user.email) {
          console.log(`Sending email to ${user.email} for report ${updatedReport.report_id}`);
          await sendStatusUpdateEmail(user.email, updatedReport.report_id, status, user.first_name);
        }
      }

      return updatedReport;
    }));

    res.json({ message: 'Status updates and notifications applied successfully', reports: results });
  } catch (err) {
    console.error('Error in bulk update:', err);
    res.status(500).json({ error: 'Failed to apply status updates' });
  }
});


module.exports = router;
