const express = require('express');
const router = express.Router();
const User = require('../schemas/User');
const EmailVerificationToken = require('../schemas/EmailVerificationToken');
require('dotenv').config();

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
      res.status(400).json({ error: 'Verification token has expired. Please request a new one.' });
      return res.redirect(`https://neighborhood-safety-app.vercel.app/login/verification?error=Token is expired`); // Redirect on expiry
    }

    // Find the user 
    const user = await User.findById(verificationTokenRecord.userId);

    if (!user) {
        return res.redirect(`https://neighborhood-safety-app.vercel.app/login/verification?error=invalid user`); // Redirect on invalid user
    }

    // Mark the user as verified
    user.isVerified = true;
    await user.save();
    // Delete the used  token
    await EmailVerificationToken.deleteOne({ _id: verificationTokenRecord._id });
    res.status(200).json({ message: 'Email verified successfully!' });

    // Redirect to the app with a success message (using the custom scheme)
     return res.status(200).json({ message: 'Email verified successfully!' });

    
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ error: 'Failed to verify email.' });
    return res.redirect(`https://neighborhood-safety-app.vercel.app/login/verification?error=Server failed to verify`); // Redirect on server error    
  }
});

module.exports = router;