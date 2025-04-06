const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Serve static files
app.use('/features', express.static(path.join(__dirname, 'features')));

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API routes
// app.use('/api/reports', require('./api/reports'));
app.use('/api/users', require('./api/users'));
// app.use('/api/health', require('./api/health'));

// Export for Vercel
module.exports = app;