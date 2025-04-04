const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define the Report Schema
const reportSchema = new mongoose.Schema({
  report_id: { type: String, required: true },
  issueType: String,
  location: String,
  description: String,
  photoUri: String,
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: "Submitted" }, 
});

const Report = mongoose.model('Report', reportSchema, 'reports');

try {
  app.use('/features', express.static(path.join(__dirname, 'features')));
} catch (err) {
  console.error('Error setting up static middleware:', err);
}

const path = require('path');

// Serve a simple HTML page for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api-tester.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'features', 'api-tester.html'));
});

// Health Check Endpoint
// This endpoint checks the health of the API and database connection
// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;

    // Determine the overall server status
    const statusMessage = dbState === 1 ? 'Server is running' : 'Server is down';

    res.status(200).json({
      status: statusMessage,
      database: dbState === 1 ? 'Connected' : 'Disconnected',
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

// API Route to Submit Reports
app.post('/api/reports', async (req, res) => {
  try {
    const report = new Report(req.body);
    await report.save();
    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit report' });
  }
});


// Export for Vercel
module.exports = app;
