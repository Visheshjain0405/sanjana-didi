const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'didi_bhai_super_secret_key_2026';

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields (name, email, password, role) are required.' });
    }

    if (!['didi', 'bhai'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either "didi" or "bhai".' });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'Account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const newUser = new User({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role,
      avatar: role === 'didi' ? '👸' : '👦',
    });

    await newUser.save();

    return res.status(201).json({
      message: 'User registered successfully!',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar,
      },
    });
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({ error: 'Server error during registration.' });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password. Please try again.' });
    }

    let isMatch = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(cleanPassword, user.password);
    } else {
      isMatch = user.password === cleanPassword;
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password. Please try again.' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || (user.role === 'didi' ? '👸' : '👦'),
      },
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ error: 'Server error during authentication.' });
  }
};

// Seed Initial Admin Users
exports.seed = async (req, res) => {
  try {
    const count = await User.countDocuments();
    if (count > 0) {
      return res.json({ message: 'Users already seeded in MongoDB.', count });
    }

    const initialUsers = [
      {
        name: 'Sanjana Didi',
        email: 'sanjana@gmail.com',
        password: await bcrypt.hash('didi123', 10),
        role: 'didi',
        avatar: '👸',
      },
      {
        name: 'Bhai',
        email: 'bhai@gmail.com',
        password: await bcrypt.hash('bhai123', 10),
        role: 'bhai',
        avatar: '👦',
      },
    ];

    const created = await User.insertMany(initialUsers);
    return res.json({ message: 'Initial accounts seeded successfully in MongoDB!', created });
  } catch (err) {
    console.error('Seed Error:', err);
    return res.status(500).json({ error: 'Failed to seed users in MongoDB.' });
  }
};

// Save / Sync Push Token
exports.savePushToken = async (req, res) => {
  try {
    const { userId, pushToken } = req.body;

    if (!userId || !pushToken) {
      return res.status(400).json({ error: 'userId and pushToken are required.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { pushToken },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ message: 'Push token updated successfully', pushToken: updatedUser.pushToken });
  } catch (err) {
    console.error('Push Token Error:', err);
    return res.status(500).json({ error: 'Server error updating push token.' });
  }
};
