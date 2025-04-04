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
  location: String,
  description: String,
  photoUri: String,
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: "Submitted" }, 
});

// User Schema
const userSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true},
  phone_number: { type: String },
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
      uptime: process.uptime(),
      lastUpTime: lastUpTime ? lastUpTime.toISOString() : null, // Include the last "up" time
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
