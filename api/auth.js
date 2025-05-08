const express = require('express');
const router = express.Router();
const User = require('../schemas/User');
const EmailVerificationToken = require('../schemas/EmailVerificationToken');

// GET /api/auth/verify-email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is missing.' });
    }

    // Find token in the database
    const verificationTokenRecord = await EmailVerificationToken.findOne({ token });

    if (!verificationTokenRecord) {
      return res.status(400).json({ error: 'Invalid verification token.' });
    }

    // Check if the token has expired
    if (verificationTokenRecord.expiresAt < new Date()) {
      await EmailVerificationToken.deleteOne({ _id: verificationTokenRecord._id });
      return res.status(400).json({ error: 'Verification token has expired. Please request a new one.' });
    }

    // Find the user 
    const user = await User.findById(verificationTokenRecord.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found for this token.' });
    }

    // Mark the user as verified
    user.isEmailVerified = true;
    await user.save();

    // Delete the used  token
    await EmailVerificationToken.deleteOne({ _id: verificationTokenRecord._id });

    res.status(200).json({ message: 'Email verified successfully!' });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ error: 'Failed to verify email.' });
  }
});

module.exports = router;