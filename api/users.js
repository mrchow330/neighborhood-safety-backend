const express = require('express');
const router = express.Router();
const User = require('../schemas/User'); // Updated path to the User schema

// API Route to Create a User Account
router.post('/', async (req, res) => {
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
      console.error('Duplicate key error:', err);
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

module.exports = router;