const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { run, get } = require('../db/database');
const { logActivity } = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'patentsense-secret-key-12345';

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
};

// Register Route
router.post('/register', async (req, res) => {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const existing = await get("SELECT * FROM users WHERE email = ?", [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Initial check: if this is the first user, assign them as 'admin' role
    const usersCount = await get("SELECT COUNT(*) as count FROM users");
    const role = usersCount.count === 0 ? 'admin' : 'user';

    const result = await run(
      "INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)",
      [email, passwordHash, fullName, role]
    );

    const userPayload = { 
      id: result.id, 
      email, 
      fullName, 
      role,
      organization: '',
      researchInterests: [],
      preferences: { theme: 'dark', notifications: true, language: 'en' }
    };

    await logActivity('INFO', `New user registered: ${email} (role: ${role})`, result.id);

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      token,
      user: userPayload
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const userPayload = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      organization: user.organization || '',
      researchInterests: user.research_interests ? JSON.parse(user.research_interests) : [],
      preferences: {
        theme: user.theme || 'dark',
        notifications: !!user.notifications,
        language: user.language || 'en'
      }
    };

    await logActivity('INFO', `User authenticated: ${user.email}`, user.id);

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: userPayload
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get current user details
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await get("SELECT * FROM users WHERE id = ?", [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        organization: user.organization || '',
        researchInterests: user.research_interests ? JSON.parse(user.research_interests) : [],
        preferences: {
          theme: user.theme || 'dark',
          notifications: !!user.notifications,
          language: user.language || 'en'
        }
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Update Profile
router.put('/profile', authenticateToken, async (req, res) => {
  const { fullName, organization, researchInterests } = req.body;
  if (!fullName) {
    return res.status(400).json({ error: 'Full name is required.' });
  }
  try {
    const interestsStr = researchInterests ? JSON.stringify(researchInterests) : '[]';
    await run(
      "UPDATE users SET full_name = ?, organization = ?, research_interests = ? WHERE id = ?",
      [fullName, organization || '', interestsStr, req.user.id]
    );

    const user = await get("SELECT * FROM users WHERE id = ?", [req.user.id]);
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        organization: user.organization || '',
        researchInterests: user.research_interests ? JSON.parse(user.research_interests) : [],
        preferences: {
          theme: user.theme || 'dark',
          notifications: !!user.notifications,
          language: user.language || 'en'
        }
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile settings.' });
  }
});

// Update Preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  const { theme, notifications, language } = req.body;
  try {
    const notifVal = notifications ? 1 : 0;
    await run(
      "UPDATE users SET theme = ?, notifications = ?, language = ? WHERE id = ?",
      [theme || 'dark', notifVal, language || 'en', req.user.id]
    );

    const user = await get("SELECT * FROM users WHERE id = ?", [req.user.id]);
    res.json({
      success: true,
      preferences: {
        theme: user.theme,
        notifications: !!user.notifications,
        language: user.language
      }
    });
  } catch (err) {
    console.error('Update preferences error:', err);
    res.status(500).json({ error: 'Failed to save preferences.' });
  }
});

// Change Password
router.put('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new passwords are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }
  try {
    const user = await get("SELECT password_hash FROM users WHERE id = ?", [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    await run("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, req.user.id]);

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

module.exports = {
  router,
  authenticateToken
};
