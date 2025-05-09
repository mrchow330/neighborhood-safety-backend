const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const emailVerificationTokenSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User', // Reference to the User model
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  expires: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model('EmailVerificationToken', emailVerificationTokenSchema);