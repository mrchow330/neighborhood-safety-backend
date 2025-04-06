const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  report_id: { type: String, required: true },
  issueType: String,
  location: { type: String, required: true },
  description: { type: String, required: true },
  photoUri: String,
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: 'Submitted' },
});

module.exports = mongoose.model('Report', reportSchema);