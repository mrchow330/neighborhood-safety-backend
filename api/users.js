const express = require('express');
const router = express.Router();
const User = require('../schemas/User'); // Import the User schema
const bcrypt = require('bcryptjs'); // Use bcryptjs instead of bcrypt
const jwt = require('jsonwebtoken'); // For generating tokens
const {v4: uuidv4} = require('uuid');
const EmailVerificationToken = require('../schemas/EmailVerificationToken'); //new schema for email verification 
const sendVerificationEmail = require('../utils/email').sendVerificationEmail;
require('dotenv').config();


console.log('Backend is alive in /api/users!');

// POST /api/users/login - Login an existing user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    const { _id, email, first_name, last_name, phone_number, isModerator, createdAt } = user;

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        userId: _id,
        username,
        email,
        first_name,
        last_name,
        phone_number,
        isModerator,
        createdAt,
      },
    });
  } catch (err) {
    console.error('Error logging in user:', err);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

// POST /api/users - Create a new user
router.post('/', async (req, res) => {
  console.log('Backend is alive in /api/users!');
  try {
    const { first_name, last_name, username, email, phone_number, password } = req.body;

    if (!first_name || !last_name || !username || !password) {
      return res.status(400).json({ error: 'First name, last name, username, and password are required' });
    }

    if (!email && !phone_number) {
      return res.status(400).json({ error: 'You must provide either an email or a phone number.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = new User({
      first_name,
      last_name,
      username,
      email: email || null,
      phone_number: phone_number || null,
      password: hashedPassword, // Save the hashed password
      isVerified: false,
    });
    
    console.log('User object before save:', user); 
    await user.save();
    console.log('User object after save:', user.toObject()); 

    //generate and store unique token for email verification
    const verificationToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newVerificationToken = new EmailVerificationToken(
      {
        userId: user._id,
        token: verificationToken,
        created: new Date(),
        expires: expiresAt,

      }
    )
    await newVerificationToken.save();

    if (user.email) {
      console.log('checking user email.')
      const verificationLink = `${req.protocol}://${req.get('host')}/api/auth/verify-email?token=${verificationToken}`;
      try {
        await sendVerificationEmail(user.email, verificationLink, user.first_name);
        console.log('Verification email sent successfully');
      } catch (error) {
        console.error('Error sending verification email:', error);
      }
      console.log('Created User Object:', user.toObject());
      res.status(201).json({
        message: 'User account created successfully. Please check your email to verify your account.',
        user: user.toObject()
      });
    } else {
      res.status(201).json({ message: 'User account created successfully.', user });
    }
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

// GET /api/users/:id - Get a user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('username email');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 🔐 Middleware for auth
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user; // decoded token
    next();
  });
}

// GET /api/users/me - Get current logged-in user's info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('email username first_name last_name');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      email: user.email,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name
    });
  } catch (err) {
    console.error('Error getting user profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
