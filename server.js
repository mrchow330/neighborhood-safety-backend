const express = require('express');
const mongoose = require('mongoose');
mongoose.set('strictQuery', true);
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err.message);
});

// Serve static files
app.use('/features', express.static(path.join(__dirname, 'features')));


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

app.get('/admin-login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'features', 'admin-login.html'));
});

app.get('/admin-dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'features', 'admin', 'admin-dashboard.html'));
});

app.get('/manage-users.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'features', 'admin', 'manage-users.html'));
});

app.get('/manage-reports.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'features', 'admin', 'manage-reports.html'));
});

// Variable to track the last time the server was "running"
let totalUptime = 0;
let lastCheckedTime = null;

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;

    // Determine the overall server status
    const isRunning = dbState === 1;
    const statusMessage = isRunning ? 'Server is running' : 'Server is down';

    // Update the total uptime if the server is running
    const currentTime = new Date();
    if (isRunning) {
      if (lastCheckedTime) {
        totalUptime += (currentTime - lastCheckedTime) / 1000; // Add elapsed time in seconds
      }
    }
    lastCheckedTime = currentTime;

    res.status(200).json({
      status: statusMessage,
      database: isRunning ? 'Connected' : 'Disconnected',
      uptime: totalUptime, // Total uptime in seconds
      timestamp: currentTime.toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to retrieve health status',
      error: err.message,
    });
  }
});

// API Route to Create a Report
const reportsRoute = require('./api/reports');
app.use('/api/reports', reportsRoute);


// API Route to Create a User
const usersRoute = require('./api/users');
app.use('/api/users', usersRoute);


// API Route to Google Maps
const googleMapsProxy = require('./api/google-maps-api');
app.use('/api/google-maps-api', googleMapsProxy);


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


// API Route to admin login
const adminRoute = require('./api/admin'); // Import the admin route
app.use('/api/admin', adminRoute); // Use the admin route

// API route for authentication/verification
const authRoute = require('./api/auth');
app.use('/api/auth', authRoute);


// Export for Vercel
module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}