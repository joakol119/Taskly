const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// ============================================================================
// Email + password auth (existing)
// ============================================================================

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(400).json({ error: 'El email ya está registrado' });
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, avatar_url',
      [name, email, hashed]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows.length) return res.status(401).json({ error: 'Credenciales inválidas' });
    const user = result.rows[0];
    if (!user.password) {
      return res.status(401).json({ error: 'This account uses GitHub login. Please sign in with GitHub.' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url || null }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================================
// GitHub OAuth
// ============================================================================

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Step 1: Redirect to GitHub authorization page
router.get('/github', (req, res) => {
  if (!process.env.GITHUB_CLIENT_ID) {
    return res.status(500).send('GitHub OAuth is not configured on this server.');
  }
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    scope: 'read:user user:email',
    allow_signup: 'true',
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

// Step 2: GitHub redirects back here with a code
router.get('/github/callback', async (req, res) => {
  const { code, error: ghError } = req.query;

  // User clicked "Cancel" on GitHub authorization
  if (ghError) {
    return res.redirect(`${FRONTEND_URL}/login?error=github_cancelled`);
  }
  if (!code) {
    return res.redirect(`${FRONTEND_URL}/login?error=github_no_code`);
  }
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.redirect(`${FRONTEND_URL}/login?error=github_not_configured`);
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error || !tokenData.access_token) {
      console.error('[oauth] token exchange failed:', tokenData);
      return res.redirect(`${FRONTEND_URL}/login?error=github_token_failed`);
    }
    const accessToken = tokenData.access_token;

    // Fetch user profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'Taskly',
      },
    });
    const ghUser = await userRes.json();
    if (!ghUser.id) {
      console.error('[oauth] user fetch failed:', ghUser);
      return res.redirect(`${FRONTEND_URL}/login?error=github_user_failed`);
    }

    // Some GitHub users keep their primary email private; fetch /user/emails to get one
    let email = ghUser.email;
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'User-Agent': 'Taskly',
        },
      });
      const emails = await emailsRes.json();
      if (Array.isArray(emails)) {
        const primary = emails.find((e) => e.primary && e.verified);
        email = primary ? primary.email : (emails.find((e) => e.verified) || {}).email;
      }
    }

    if (!email) {
      return res.redirect(`${FRONTEND_URL}/login?error=github_no_email`);
    }

    // Find or create user
    const githubId = String(ghUser.id);
    let user;

    // 1. Try to find by github_id (returning user)
    let existing = await db.query('SELECT * FROM users WHERE github_id = $1', [githubId]);
    if (existing.rows.length) {
      user = existing.rows[0];
      // Refresh username/avatar in case they changed
      await db.query(
        'UPDATE users SET github_username = $1, avatar_url = $2 WHERE id = $3',
        [ghUser.login, ghUser.avatar_url, user.id]
      );
      user.github_username = ghUser.login;
      user.avatar_url = ghUser.avatar_url;
    } else {
      // 2. Try to find by email (merge flow: existing email/password user)
      existing = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      if (existing.rows.length) {
        user = existing.rows[0];
        // Link this GitHub account to the existing user
        await db.query(
          'UPDATE users SET github_id = $1, github_username = $2, avatar_url = $3 WHERE id = $4',
          [githubId, ghUser.login, ghUser.avatar_url, user.id]
        );
        user.github_id = githubId;
        user.github_username = ghUser.login;
        user.avatar_url = ghUser.avatar_url;
      } else {
        // 3. Brand new user
        const created = await db.query(
          `INSERT INTO users (name, email, github_id, github_username, avatar_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [ghUser.name || ghUser.login, email, githubId, ghUser.login, ghUser.avatar_url]
        );
        user = created.rows[0];
      }
    }

    // Issue our own JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Build the URL with token + user info as query params
    // The frontend's /auth/callback page will read these and store them in localStorage
    const userPayload = encodeURIComponent(JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url || null,
      github_username: user.github_username || null,
    }));

    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&user=${userPayload}`);
  } catch (err) {
    console.error('[oauth] callback error:', err);
    res.redirect(`${FRONTEND_URL}/login?error=github_unexpected`);
  }
});

module.exports = router;
