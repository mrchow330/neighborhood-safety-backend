const mongoose = require('mongoose');

// Report Schema
const reportSchema = new mongoose.Schema({
  report_id: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issueType: String,
  location: { 
    type: { type: String, enum: ['Point'], required: false }, // GeoJSON type
    coordinates: { type: [Number], required: false }, // [longitude, latitude]
  },
  description: String,
  photoUri: String,
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: "Submitted" }, 
});

// Create a geospatial index on the location field
reportSchema.index({ location: '2dsphere' });

// Export the Report model
module.exports = mongoose.model('Report', reportSchema, 'reports');