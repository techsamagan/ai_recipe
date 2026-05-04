const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'recipe.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function register(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const passwordHash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    );
    const result = stmt.run(username.trim(), email.trim().toLowerCase(), passwordHash);

    const token = jwt.sign(
      { userId: result.lastInsertRowid, username: username.trim(), email: email.trim().toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, username: username.trim(), email: email.trim().toLowerCase() });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      const field = err.message.includes('username') ? 'Username' : 'Email';
      return res.status(409).json({ error: `${field} is already taken` });
    }
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
}

function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, username: user.username, email: user.email });
  } catch {
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}

function getProfile(req, res) {
  try {
    const user = db.prepare(
      'SELECT id, username, email, dietary_prefs, created_at FROM users WHERE id = ?'
    ).get(req.user.userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

module.exports = { register, login, getProfile };
