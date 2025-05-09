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

    if (!user.isVerified) {
        return res.status(403).json({ error: 'Account not verified. Please check your email.' });
    }


    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      userId: user._id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone_number: user.phone_number,

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
      const verificationLink = `https://neighborhood-safety-backend.vercel.app/api/users/verify?token=${verificationToken}`;
      
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
    const user = await User.findById(req.params.id).select('-password');
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

// GET /api/users/verify - Verify user email
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send('Verification token is required.');
    }

    // Find the verification token
    const verificationToken = await EmailVerificationToken.findOne({ token });

    if (!verificationToken) {
      return res.status(400).send('Invalid or expired verification token.');
    }

    // Check if the token has expired
    if (verificationToken.expires < new Date()) {
      return res.status(400).send('Verification token has expired.');
    }

    // Mark the user as verified
    const user = await User.findByIdAndUpdate(
      verificationToken.userId,
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).send('User not found.');
    }

    // Delete the verification token after successful verification
    await EmailVerificationToken.findByIdAndDelete(verificationToken._id);

    // Send a simple HTML response
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verified</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            margin-top: 50px;
          }
          h1 {
            color: #4CAF50;
          }
        </style>
      </head>
      <body>
        <h1>Email Verified!</h1>
        <p>Your email has been successfully verified. You can now log in to your account.</p>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('Error verifying user:', err);
    res.status(500).send('An error occurred while verifying the account.');
  }
});

module.exports = router;
