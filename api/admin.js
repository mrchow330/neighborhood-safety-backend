const express = require('express');
const router = express.Router();
const User = require('../schemas/User'); // Import the User schema

// POST /api/admin/login - Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the user is a moderator
    if (!user.isModerator) {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    // Validate the password (if passwords are hashed)
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Login successful
    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    console.error('Error during admin login:', err);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

module.exports = router;