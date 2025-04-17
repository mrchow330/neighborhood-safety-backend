const express = require('express');
const router = express.Router();
const User = require('../schemas/User'); // Import the User schema
const bcrypt = require('bcryptjs'); // Use bcryptjs instead of bcrypt
const jwt = require('jsonwebtoken'); // For generating tokens

// POST /api/users/login - Login an existing user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Debugging: Log the JWT_SECRET value
    console.log('JWT_SECRET:', process.env.JWT_SECRET);

    // Generate a JWT token
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '1h', // Token expires in 1 hour
    });

    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Error logging in user:', err);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

// POST /api/users - Create a new user
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

    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, 10);
    console.log('Hashed Password:', hashedPassword);

    // Create a new user
    const user = new User({
      first_name,
      last_name,
      username,
      email: email || null,
      phone_number: phone_number || null,
      password: hashedPassword, // Save the hashed password
    });
    await user.save();

    res.status(201).json({ message: 'User account created successfully', user });
  } catch (err) {
    if (err.code === 11000) {
      // Handle duplicate key error
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

module.exports = router;