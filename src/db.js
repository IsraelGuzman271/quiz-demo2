/**
 * Database module for PostgreSQL connection, schema initialization, and queries.
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
 * Default Seed Quizzes data
 * Each question has EXACTLY four answer choices and one correct answer index (0-3).
 */
const SEED_QUIZZES = [
  {
    id: 'js-fundamentals',
    title: 'JavaScript & Web Fundamentals',
    description: 'Test your understanding of modern JavaScript concepts, ES6+ features, and web standards.',
    category: 'JavaScript',
    difficulty: 'Medium',
    questions: [
      {
        id: 'js-q1',
        question: 'Which keyword declares a block-scoped variable that cannot be reassigned in JavaScript?',
        options: ['var', 'let', 'const', 'static'],
        correctIndex: 2,
        explanation: 'const creates a block-scoped constant whose identifier cannot be reassigned, though object properties can still be modified.',
      },
      {
        id: 'js-q2',
        question: 'What is the return value of typeof null in JavaScript?',
        options: ['"null"', '"undefined"', '"object"', '"boolean"'],
        correctIndex: 2,
        explanation: 'In JavaScript, typeof null returns "object". This is a historic quirk originating from the very first JavaScript implementation.',
      },
      {
        id: 'js-q3',
        question: 'Which array method creates a new array populated with the results of calling a provided function on every element?',
        options: ['forEach()', 'map()', 'filter()', 'reduce()'],
        correctIndex: 1,
        explanation: 'map() returns a new array with the results of applying the transform callback to each element of the original array.',
      },
      {
        id: 'js-q4',
        question: 'What does the strict equality operator (===) compare in JavaScript?',
        options: [
          'Value only with type coercion',
          'Both value and data type without type coercion',
          'Memory address reference only',
          'String representation of both operands',
        ],
        correctIndex: 1,
        explanation: 'The strict equality operator (===) compares both the value and the type of operands without performing automatic type conversion.',
      },
      {
        id: 'js-q5',
        question: 'Which statement accurately describes how JavaScript Promises behave?',
        options: [
          'Promises execute synchronously on the call stack',
          'Promises can transition between resolved and rejected multiple times',
          'Promises represent the eventual completion or failure of an asynchronous operation',
          'Promises block the JavaScript main thread until settled',
        ],
        correctIndex: 2,
        explanation: 'A Promise is a proxy for a value not necessarily known when the promise is created. It transitions once from pending to fulfilled or rejected.',
      },
    ],
  },
  {
    id: 'postgres-db',
    title: 'PostgreSQL & Database Essentials',
    description: 'Master relational database modeling, SQL querying, constraints, and ACID properties.',
    category: 'Databases',
    difficulty: 'Medium',
    questions: [
      {
        id: 'pg-q1',
        question: 'Which SQL clause is used to filter aggregated grouped records (after GROUP BY)?',
        options: ['WHERE', 'HAVING', 'LIMIT', 'FILTER'],
        correctIndex: 1,
        explanation: 'HAVING filters groups created by the GROUP BY clause, whereas WHERE filters individual rows before aggregation occurs.',
      },
      {
        id: 'pg-q2',
        question: 'What constraint uniquely identifies each record in a PostgreSQL database table?',
        options: ['FOREIGN KEY', 'PRIMARY KEY', 'CHECK', 'DEFAULT'],
        correctIndex: 1,
        explanation: 'A PRIMARY KEY uniquely identifies each record in a database table and cannot contain NULL values.',
      },
      {
        id: 'pg-q3',
        question: 'Which command removes all rows from a table quickly without logging individual row deletions?',
        options: ['DROP TABLE', 'DELETE ALL', 'TRUNCATE TABLE', 'REMOVE *'],
        correctIndex: 2,
        explanation: 'TRUNCATE TABLE quickly deletes all rows from a table by bypassing row-by-row logging, making it faster than DELETE.',
      },
      {
        id: 'pg-q4',
        question: 'In relational database theory, what does the ACID acronym stand for?',
        options: [
          'Atomicity, Consistency, Isolation, Durability',
          'Authentication, Cryptography, Integrity, Decryption',
          'Allocation, Concurrency, Indexing, Distribution',
          'Array, Collection, Iteration, Dictionary',
        ],
        correctIndex: 0,
        explanation: 'ACID stands for Atomicity (all-or-nothing), Consistency (rules maintained), Isolation (independent transactions), and Durability (persisted).',
      },
      {
        id: 'pg-q5',
        question: 'Which JOIN returns all records from the left table and matched records from the right table?',
        options: ['INNER JOIN', 'RIGHT JOIN', 'LEFT JOIN', 'FULL OUTER JOIN'],
        correctIndex: 2,
        explanation: 'A LEFT JOIN returns all rows from the left table and the matching rows from the right table (or NULLs where there is no match).',
      },
    ],
  },
  {
    id: 'node-express',
    title: 'Node.js & Express Architecture',
    description: 'Understand backend web servers, HTTP status codes, middleware stacks, and async I/O.',
    category: 'Backend',
    difficulty: 'Easy',
    questions: [
      {
        id: 'node-q1',
        question: 'What is the primary function of middleware in an Express application?',
        options: [
          'Directly compile JavaScript code to machine instructions',
          'Access request and response objects and invoke the next middleware function',
          'Manage SQL database migrations automatically',
          'Render CSS style sheets inside client browsers',
        ],
        correctIndex: 1,
        explanation: 'Middleware functions have access to the request object (req), response object (res), and the next middleware function in the cycle.',
      },
      {
        id: 'node-q2',
        question: 'Which HTTP status code signifies that a client is not authenticated?',
        options: ['200 OK', '401 Unauthorized', '403 Forbidden', '404 Not Found'],
        correctIndex: 1,
        explanation: 'HTTP 401 Unauthorized indicates that the request requires user authentication credentials.',
      },
      {
        id: 'node-q3',
        question: 'Which HTTP status code signifies that an authenticated user is forbidden from accessing a resource (e.g. non-admin)?',
        options: ['400 Bad Request', '401 Unauthorized', '403 Forbidden', '500 Server Error'],
        correctIndex: 2,
        explanation: 'HTTP 403 Forbidden indicates that the server understands who the user is, but the user does not have permission for that action.',
      },
      {
        id: 'node-q4',
        question: 'What is the core event-driven concurrency model used by Node.js?',
        options: [
          'Single-threaded event loop with non-blocking I/O',
          'Multi-threaded process per connection architecture',
          'Synchronous blocking execution thread pool only',
          'Forking a new operating system process for each incoming socket',
        ],
        correctIndex: 0,
        explanation: 'Node.js uses an event-driven, non-blocking I/O model on a single execution thread with libuv handling background I/O operations.',
      },
      {
        id: 'node-q5',
        question: 'Which core Node.js module provides file system operations?',
        options: ['http', 'path', 'fs', 'events'],
        correctIndex: 2,
        explanation: 'The built-in "fs" module allows interaction with the file system both synchronously and asynchronously via Promises or callbacks.',
      },
    ],
  },
  {
    id: 'computer-science',
    title: 'Computer Science & Data Structures',
    description: 'Fundamental algorithms, big-O time complexities, and core data structure concepts.',
    category: 'Computer Science',
    difficulty: 'Hard',
    questions: [
      {
        id: 'cs-q1',
        question: 'What is the worst-case time complexity of binary search on a sorted array of size n?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
        correctIndex: 1,
        explanation: 'Binary search halves the search space with each iteration, yielding an O(log n) time complexity in both average and worst cases.',
      },
      {
        id: 'cs-q2',
        question: 'Which data structure operates strictly on a Last-In, First-Out (LIFO) principle?',
        options: ['Queue', 'Stack', 'Linked List', 'Binary Heap'],
        correctIndex: 1,
        explanation: 'A Stack is a LIFO (Last-In, First-Out) data structure where elements are pushed and popped from the same end (the top).',
      },
      {
        id: 'cs-q3',
        question: 'What is the average time complexity of lookups in a well-distributed Hash Table?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        correctIndex: 0,
        explanation: 'With a good hash function and proper load factor, hash table lookups execute in O(1) constant average time.',
      },
      {
        id: 'cs-q4',
        question: 'Which binary tree traversal visits the root node before visiting its left and right subtrees?',
        options: ['In-order traversal', 'Pre-order traversal', 'Post-order traversal', 'Level-order traversal'],
        correctIndex: 1,
        explanation: 'Pre-order traversal visits nodes in the order: Root -> Left Subtree -> Right Subtree.',
      },
      {
        id: 'cs-q5',
        question: 'Which algorithmic paradigm breaks a problem into independent subproblems and combines their solutions?',
        options: ['Dynamic Programming', 'Divide and Conquer', 'Greedy Algorithm', 'Backtracking'],
        correctIndex: 1,
        explanation: 'Divide and Conquer recursively breaks a problem into independent subproblems, solves them, and merges the solutions (e.g. Merge Sort).',
      },
    ],
  },
];

/**
 * Initialize database schema and seed default quizzes
 */
async function initDb() {
  const p = getPool();

  // Phase 1: Users table
  const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'admin')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await p.query(createUsersTableQuery);

  // Phase 2: Quizzes table
  const createQuizzesTableQuery = `
    CREATE TABLE IF NOT EXISTS quizzes (
      id VARCHAR(50) PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      description TEXT NOT NULL,
      category VARCHAR(50) NOT NULL,
      difficulty VARCHAR(20) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await p.query(createQuizzesTableQuery);

  // Phase 2: Questions table (options stored as serialized JSON array of 4 strings)
  const createQuestionsTableQuery = `
    CREATE TABLE IF NOT EXISTS questions (
      id VARCHAR(50) PRIMARY KEY,
      quiz_id VARCHAR(50) REFERENCES quizzes(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_index INTEGER NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
      explanation TEXT NOT NULL,
      order_num INTEGER NOT NULL DEFAULT 0
    );
  `;
  await p.query(createQuestionsTableQuery);

  // Phase 2: Quiz Attempts table (storing scores, percentage, answers)
  const createAttemptsTableQuery = `
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      quiz_id VARCHAR(50) REFERENCES quizzes(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      percentage INTEGER NOT NULL,
      answers TEXT NOT NULL,
      completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await p.query(createAttemptsTableQuery);

  console.log('[DB] PostgreSQL schema initialized (users, quizzes, questions, quiz_attempts).');

  // Seed default quizzes and questions if empty
  await seedQuizzesIfEmpty();

  return { isInMemory };
}

/**
 * Seed quizzes and questions if not yet inserted
 */
async function seedQuizzesIfEmpty() {
  const countCheck = await query('SELECT COUNT(*) as count FROM quizzes');
  const existingCount = parseInt(countCheck.rows[0].count, 10);

  if (existingCount > 0) {
    return;
  }

  console.log('[DB] Seeding default quizzes and questions with exactly 4 options each...');

  for (const quiz of SEED_QUIZZES) {
    await query(
      `INSERT INTO quizzes (id, title, description, category, difficulty)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [quiz.id, quiz.title, quiz.description, quiz.category, quiz.difficulty]
    );

    let order = 0;
    for (const q of quiz.questions) {
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Question ${q.id} must have exactly 4 answer options`);
      }
      await query(
        `INSERT INTO questions (id, quiz_id, question, options, correct_index, explanation, order_num)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [q.id, quiz.id, q.question, JSON.stringify(q.options), q.correctIndex, q.explanation, order++]
      );
    }
  }

  console.log(`[DB] Seeded ${SEED_QUIZZES.length} quizzes successfully.`);
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
 * Get list of all available quizzes with question counts
 */
async function getQuizzes() {
  const quizzesRes = await query(
    `SELECT q.id, q.title, q.description, q.category, q.difficulty,
            COUNT(ques.id)::int as question_count
     FROM quizzes q
     LEFT JOIN questions ques ON q.id = ques.quiz_id
     GROUP BY q.id, q.title, q.description, q.category, q.difficulty, q.created_at
     ORDER BY q.created_at ASC`
  );
  return quizzesRes.rows;
}

/**
 * Get a specific quiz metadata by ID
 */
async function getQuizById(quizId) {
  const res = await query('SELECT * FROM quizzes WHERE id = $1', [quizId]);
  return res.rows[0] || null;
}

/**
 * Get questions for a quiz
 * @param {string} quizId
 * @param {boolean} includeAnswers - if true, includes correct_index and explanation (for grading only)
 */
async function getQuestionsByQuizId(quizId, includeAnswers = false) {
  const fields = includeAnswers
    ? 'id, quiz_id, question, options, correct_index, explanation, order_num'
    : 'id, quiz_id, question, options, order_num';

  const res = await query(
    `SELECT ${fields} FROM questions WHERE quiz_id = $1 ORDER BY order_num ASC, id ASC`,
    [quizId]
  );

  return res.rows.map((row) => {
    let parsedOptions = [];
    try {
      parsedOptions = typeof row.options === 'string' ? JSON.parse(row.options) : row.options;
    } catch (e) {
      parsedOptions = [];
    }
    const q = {
      id: row.id,
      quizId: row.quiz_id,
      question: row.question,
      options: parsedOptions,
      orderNum: row.order_num,
    };
    if (includeAnswers) {
      q.correctIndex = row.correct_index;
      q.explanation = row.explanation;
    }
    return q;
  });
}

/**
 * Record a quiz attempt in the database
 */
async function recordQuizAttempt({ userId, quizId, score, totalQuestions, percentage, answers }) {
  const res = await query(
    `INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions, percentage, answers)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, quiz_id, score, total_questions, percentage, completed_at`,
    [
      userId || null,
      quizId,
      score,
      totalQuestions,
      percentage,
      typeof answers === 'string' ? answers : JSON.stringify(answers),
    ]
  );
  return res.rows[0];
}

/**
 * Get past attempts for a given user
 */
async function getQuizAttemptsByUserId(userId) {
  const res = await query(
    `SELECT qa.id, qa.quiz_id, q.title as quiz_title, qa.score, qa.total_questions,
            qa.percentage, qa.completed_at
     FROM quiz_attempts qa
     JOIN quizzes q ON qa.quiz_id = q.id
     WHERE qa.user_id = $1
     ORDER BY qa.completed_at DESC`,
    [userId]
  );
  return res.rows;
}

/**
 * Close database pool
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
  getQuizzes,
  getQuizById,
  getQuestionsByQuizId,
  recordQuizAttempt,
  getQuizAttemptsByUserId,
  closeDb,
  isInMemoryDatabase: () => isInMemory,
  SEED_QUIZZES,
};
