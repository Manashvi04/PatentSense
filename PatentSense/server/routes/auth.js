const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const getJwtSecret = require('../utils/jwtSecret');
const JWT_SECRET = getJwtSecret();
const { run, get } = require('../db/database');
const { logActivity } = require('../utils/logger');

const PASSWORD_RESET_TTL_MINUTES = 30;
const PASSWORD_RESET_MESSAGE = 'If an account exists for this email, password reset instructions will be sent shortly.';
const resetRequestWindows = new Map();

const parseResearchInterests = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
};

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required.' });

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    try {
      const user = await get('SELECT id, email, role, token_version FROM users WHERE id = ?', [decoded.id]);
      if (!user || Number(decoded.tokenVersion || 0) !== Number(user.token_version || 0)) {
        return res.status(401).json({ error: 'Session is no longer valid. Please sign in again.' });
      }
      req.user = { ...decoded, id: user.id, email: user.email, role: user.role };
      return next();
    } catch (dbError) {
      console.error('Authentication lookup failed:', dbError);
      return res.status(500).json({ error: 'Authentication could not be verified.' });
    }
  });
};

// Register Route
router.post('/register', async (req, res) => {
  const { email, password, fullName } = req.body;

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof password !== 'string' || password.length < 8 || typeof fullName !== 'string' || !fullName.trim()) {
    return res.status(400).json({ error: 'Enter a valid email, a full name, and a password of at least 8 characters.' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await get("SELECT * FROM users WHERE email = ?", [normalizedEmail]);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const role = 'user';

    const result = await run(
      "INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)",
      [normalizedEmail, passwordHash, fullName.trim(), role]
    );

    const userPayload = { 
      id: result.id, 
      email: normalizedEmail,
      fullName: fullName.trim(),
      role,
      tokenVersion: 0,
      organization: '',
      profession: '',
      researchInterests: [],
      preferences: { theme: 'dark', notifications: true, language: 'en', defaultDomain: 'Artificial Intelligence', twoFactor: false }
    };

    await logActivity('INFO', `New user registered: ${normalizedEmail} (role: ${role})`, result.id);

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

router.post('/password-reset/request', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }

  const now = Date.now();
  const requestKey = req.ip || req.socket.remoteAddress || 'unknown';
  const recent = (resetRequestWindows.get(requestKey) || []).filter((timestamp) => now - timestamp < 60_000);
  if (recent.length >= 5) return res.status(429).json({ error: 'Too many reset requests. Try again in a minute.' });
  recent.push(now);
  resetRequestWindows.set(requestKey, recent);

  const hasMailDelivery = Boolean(process.env.RESEND_API_KEY && process.env.PASSWORD_RESET_EMAIL_FROM);
  if (process.env.NODE_ENV === 'production' && !hasMailDelivery) {
    return res.status(503).json({ error: 'Password reset delivery is not configured.' });
  }

  try {
    const user = await get('SELECT id, email FROM users WHERE email = ?', [email]);
    if (!user) return res.json({ message: PASSWORD_RESET_MESSAGE });

    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await run('DELETE FROM password_reset_tokens WHERE user_id = ? OR expires_at <= CURRENT_TIMESTAMP', [user.id]);
    await run(
      "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, datetime('now', ?))",
      [user.id, tokenHash, `+${PASSWORD_RESET_TTL_MINUTES} minutes`]
    );

    const baseUrl = (process.env.APP_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
    if (hasMailDelivery) {
      try {
        const mailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: process.env.PASSWORD_RESET_EMAIL_FROM,
            to: [user.email],
            subject: 'Reset your PatentSense password',
            html: `<p>A password reset was requested for your PatentSense account.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in ${PASSWORD_RESET_TTL_MINUTES} minutes. If you did not request it, you can ignore this email.</p>`,
          }),
        });
        if (!mailResponse.ok) throw new Error(`Email provider returned ${mailResponse.status}`);
      } catch (deliveryError) {
        await run('DELETE FROM password_reset_tokens WHERE token_hash = ?', [tokenHash]);
        console.error('Password reset email delivery failed:', deliveryError.message);
        return res.json({ message: PASSWORD_RESET_MESSAGE });
      }
      return res.json({ message: PASSWORD_RESET_MESSAGE });
    }

    // Development-only reset links keep local installations testable without an email provider.
    return res.json({ message: PASSWORD_RESET_MESSAGE, developmentResetUrl: resetUrl });
  } catch (err) {
    console.error('Password reset request failed:', err);
    return res.status(500).json({ error: 'Password reset could not be requested.' });
  }
});

router.post('/password-reset/confirm', async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (typeof token !== 'string' || token.length < 32 || typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ error: 'A valid reset token and password of at least 8 characters are required.' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const reset = await get(
      'SELECT user_id FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP',
      [tokenHash]
    );
    if (!reset) return res.status(400).json({ error: 'This password reset link is invalid or expired.' });

    const consumed = await run(
      'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token_hash = ? AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP',
      [tokenHash]
    );
    if (consumed.changes !== 1) return res.status(400).json({ error: 'This password reset link is invalid or expired.' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await run('UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?', [passwordHash, reset.user_id]);
    await run('DELETE FROM password_reset_tokens WHERE user_id = ?', [reset.user_id]);
    await logActivity('INFO', `Password reset completed for user ${reset.user_id}.`, reset.user_id);
    return res.json({ success: true, message: 'Password reset completed. Sign in with your new password.' });
  } catch (err) {
    console.error('Password reset confirmation failed:', err);
    return res.status(500).json({ error: 'Password could not be reset.' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await get("SELECT * FROM users WHERE email = ?", [email.trim().toLowerCase()]);
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
      tokenVersion: Number(user.token_version || 0),
      organization: user.organization || '',
      profession: user.profession || '',
      researchInterests: parseResearchInterests(user.research_interests),
      preferences: {
        theme: user.theme || 'dark',
        notifications: !!user.notifications,
        language: user.language || 'en',
        defaultDomain: user.default_domain || 'Artificial Intelligence',
        twoFactor: !!user.two_factor
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
        profession: user.profession || '',
        researchInterests: parseResearchInterests(user.research_interests),
        preferences: {
          theme: user.theme || 'dark',
          notifications: !!user.notifications,
          language: user.language || 'en',
          defaultDomain: user.default_domain || 'Artificial Intelligence',
          twoFactor: !!user.two_factor
        }
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Update Profile
router.put('/profile', authenticateToken, async (req, res) => {
  const { fullName, email, organization, profession, researchInterests } = req.body;
  if (typeof fullName !== 'string' || !fullName.trim() || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'A full name and valid email address are required.' });
  }
  try {
    const duplicate = await get('SELECT id FROM users WHERE email = ? AND id != ?', [email.trim().toLowerCase(), req.user.id]);
    if (duplicate) return res.status(409).json({ error: 'That email address is already in use.' });
    const interestsStr = researchInterests ? JSON.stringify(researchInterests) : '[]';
    await run(
      "UPDATE users SET full_name = ?, email = ?, organization = ?, profession = ?, research_interests = ? WHERE id = ?",
      [fullName.trim(), email.trim().toLowerCase(), organization || '', profession || '', interestsStr, req.user.id]
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
        profession: user.profession || '',
        researchInterests: parseResearchInterests(user.research_interests),
        preferences: {
          theme: user.theme || 'dark',
          notifications: !!user.notifications,
          language: user.language || 'en',
          defaultDomain: user.default_domain || 'Artificial Intelligence',
          twoFactor: !!user.two_factor
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
  const { theme, notifications, language, defaultDomain, twoFactor } = req.body;
  try {
    const notifVal = notifications ? 1 : 0;
    await run(
      "UPDATE users SET theme = ?, notifications = ?, language = ?, default_domain = ?, two_factor = ? WHERE id = ?",
      [theme || 'dark', notifVal, language || 'en', defaultDomain || 'Artificial Intelligence', twoFactor ? 1 : 0, req.user.id]
    );

    const user = await get("SELECT * FROM users WHERE id = ?", [req.user.id]);
    res.json({
      success: true,
      preferences: {
        theme: user.theme,
        notifications: !!user.notifications,
        language: user.language,
        defaultDomain: user.default_domain,
        twoFactor: !!user.two_factor
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
