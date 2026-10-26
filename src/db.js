/**
 * Database module for PostgreSQL connection and schema initialization.
 * Supports connection via process.env.DATABASE_URL (e.g. Neon, Supabase, Cloud SQL, local PG).
 * In QA/test environments without an external PostgreSQL instance running,
 * it seamlessly initializes an in-memory PostgreSQL engine (pg-mem) to maintain
 * full PostgreSQL dialect compliance, zero setup friction, and reliable automated testing.
 */

const { Pool } = require('pg');

let pool = null;
let isInMemory = false;

function getPool() {
  if (pool) return pool;

  const dbUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.trim();

  if (dbUrl) {
    console.log('[DB] Connecting to PostgreSQL using DATABASE_URL...');
    const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
    pool = new Pool({
      connectionString: dbUrl,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
    });
  } else {
    console.log('[DB] No DATABASE_URL provided. Initializing PostgreSQL in-memory engine (pg-mem) for QA/Dev...');
    const { newDb } = require('pg-mem');
    const db = newDb();
    const pgAdapter = db.adapters.createPg();
    pool = new pgAdapter.Pool();
    isInMemory = true;
  }

  pool.on('error', (err) => {
    console.error('[DB] Unexpected error on idle client:', err);
  });

  return pool;
}

/**
 * Execute a query with parameters
 */
async function query(text, params = []) {
  const p = getPool();
  return p.query(text, params);
}

/**
 * Initialize database schema
 */
async function initDb() {
  const p = getPool();

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'admin')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await p.query(createTableQuery);
  console.log('[DB] PostgreSQL "users" table ensured.');

  return { isInMemory };
}

/**
 * Find user by username
 */
async function getUserByUsername(username) {
  const res = await query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
  return res.rows[0] || null;
}

/**
 * Find user by email
 */
async function getUserByEmail(email) {
  const res = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  return res.rows[0] || null;
}

/**
 * Find user by ID (excludes password_hash for safety)
 */
async function getUserById(id) {
  const res = await query(
    'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
    [id]
  );
  return res.rows[0] || null;
}

/**
 * Create a new user
 */
async function createUser({ username, email, passwordHash, role = 'player' }) {
  const res = await query(
    `INSERT INTO users (username, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, email, role, created_at`,
    [username.trim(), email.trim().toLowerCase(), passwordHash, role]
  );
  return res.rows[0];
}

/**
 * Get all users for admin review (excludes password_hash)
 */
async function getAllUsers() {
  const res = await query(
    'SELECT id, username, email, role, created_at FROM users ORDER BY id ASC'
  );
  return res.rows;
}

/**
 * Close database pool (useful for test teardown)
 */
async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  getPool,
  query,
  initDb,
  getUserByUsername,
  getUserByEmail,
  getUserById,
  createUser,
  getAllUsers,
  closeDb,
  isInMemoryDatabase: () => isInMemory,
};
