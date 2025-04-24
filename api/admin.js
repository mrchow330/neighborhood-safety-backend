const express = require('express');
const router = express.Router();
const User = require('../schemas/User'); // Import the User schema
const bcrypt = require('bcryptjs'); // Use bcryptjs for password hashing

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

    // Validate the password using bcrypt
    const isPasswordValid = bcrypt.compareSync(password, user.password);
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

// GET /api/admin/users - Get all users
router.get('/users', async (req, res) => {
  try {
    // Fetch all users, excluding the password field
    const users = await User.find({}, '-password'); // Exclude the password field
    res.status(200).json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PATCH /api/admin/users/:id/toggle-moderator - Toggle isModerator status
router.patch('/users/:id/toggle-moderator', async (req, res) => {
  try {
    const { id } = req.params;
    const { isModerator } = req.body;

    // Update the user's isModerator status
    const user = await User.findByIdAndUpdate(
      id,
      { isModerator },
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
  
    res.status(200).json({ message: `User's moderator status updated successfully` });
  } catch (err) {
    console.error('Error updating moderator status:', err);
    res.status(500).json({ error: 'Failed to update moderator status' });
  }
});

module.exports = router;