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

// Report Schema
const reportSchema = new mongoose.Schema({
  report_id: { type: String, required: true },
  issueType: String,
  location: {type: String, required: true},
  // location: { 
  //   type: { type: String, enum: ['Point'], required: false }, // GeoJSON type
  //   coordinates: { type: [Number], required: false }, // [longitude, latitude]
  // },
  description: String,
  photoUri: String,
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: "Submitted" }, 
});

// A geospatial index on the location field
reportSchema.index({ location: '2dsphere' });

// User Schema
const userSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  phone_number: { type: String, required: true },
  password: { type: String, required: true }, // Will hash passwords in the future
  isModerator: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Custom validation to ensure at least one of `email` or `phone_number` is provided
userSchema.pre('validate', function (next) {
  if (!this.email && !this.phone_number) {
    next(new Error('A user must have either an email or a phone number.'));
  } else {
    next();
  }
});

const Report = mongoose.model('Report', reportSchema, 'reports');

const User = mongoose.model('User', userSchema, 'users');

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

app.get('/api-report-tester.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'features', 'api-report-tester.html'));
});

app.get('/api-user-tester.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'features', 'api-user-tester.html'));
});

app.get('/api-map-tester.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'features', 'api-map-tester.html'));
});


// Variable to track the last time the server was "running"
let lastUpTime = null;


// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;

    // Determine the overall server status
    const isRunning = dbState === 1;
    const statusMessage = isRunning ? 'Server is running' : 'Server is down';

    // Update the lastUpTime if the server is running
    if (isRunning && !lastUpTime) {
      lastUpTime = new Date(); // Set the last "up" time
    } else if (!isRunning) {
      lastUpTime = null; // Reset the last "up" time if the server is down
    }

    res.status(200).json({
      status: statusMessage,
      database: isRunning ? 'Connected' : 'Disconnected',
      uptime: process.uptime(), // Total uptime since the server started
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
    const { report_id, issueType, location, description, photoUri } = req.body;
    // const { report_id, issueType, latitude, longitude, description, photoUri } = req.body;

    // if (!latitude || !longitude) {
    //   return res.status(400).json({ error: 'Latitude and longitude are required' });
    // }

    const report = new Report({
      report_id,
      issueType,
      location,
      // location: {
      //   type: 'Point',
      //   coordinates: [longitude, latitude], // GeoJSON format: [longitude, latitude]
      // },
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


// API Route to fetch nearby location
app.get('/near', async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 5000 } = req.query; // maxDistance in meters

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const reports = await Report.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          distanceField: 'distance', // Adds a "distance" field to each result
          maxDistance: parseInt(maxDistance), // Maximum distance in meters
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


// API Route to Create a User Account
app.post('/api/users', async (req, res) => {
  try {
    const { first_name, last_name, username, email, phone_number, password } = req.body;

    // Validate input
    if (!first_name || !last_name || !username || !password) {
      return res.status(400).json({ error: 'First name, last name, username, and password are required' });
    }

    // Ensure at least one of email or phone_number is provided
    if (!email && !phone_number) {
      return res.status(400).json({ error: 'You must provide either an email or a phone number.' });
    }

    // Create a new user
    const user = new User({ first_name, last_name, username, email: email || null, phone_number: phone_number || null, password });
    await user.save();

    res.status(201).json({ message: 'User account created successfully', user });
  } catch (err) {
    if (err.code === 11000) {
      // Log the entire error to the console
      console.error('Duplicate key error:', err);

      // Handle duplicate key error
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    console.error('Error creating user:', err); // Log other errors
    res.status(500).json({ error: 'Failed to create user account' });
  }
});


// Export for Vercel
module.exports = app;
