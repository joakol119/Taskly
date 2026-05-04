const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

async function init() {
  // Tables
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS boards (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      position INTEGER DEFAULT 0,
      color TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS board_members (
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, board_id)
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS columns (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      "order" INTEGER NOT NULL,
      column_id INTEGER REFERENCES columns(id) ON DELETE CASCADE
    )
  `);

  // Migrations (idempotent)
  await query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS labels TEXT DEFAULT '[]'`);
  await query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP`);
  await query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS done BOOLEAN DEFAULT FALSE`);
  await query(`ALTER TABLE boards ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0`);
  await query(`ALTER TABLE boards ADD COLUMN IF NOT EXISTS color TEXT`);

  // GitHub OAuth columns
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id TEXT UNIQUE`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS github_username TEXT`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS github_access_token TEXT`);
  // Password is now nullable: GitHub-only users have no password
  await query(`ALTER TABLE users ALTER COLUMN password DROP NOT NULL`);

  console.log('Database initialized');
}

module.exports = { query, init };
