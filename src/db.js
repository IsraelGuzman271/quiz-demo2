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
 * Includes: Soccer, Capitals of Hispanic Countries, American Football, and English Vocabulary.
 * Each question has EXACTLY four answer choices and one correct answer index (0-3).
 */
const SEED_QUIZZES = [
  {
    id: 'soccer',
    title: 'Soccer (Association Football)',
    description: 'Test your knowledge of the global game: World Cups, legendary players, iconic clubs, and official rules.',
    category: 'Soccer',
    difficulty: 'Medium',
    questions: [
      {
        id: 'soc-q1',
        question: "Which nation has won the most FIFA Men's World Cup titles in history?",
        options: ['Germany', 'Italy', 'Brazil', 'Argentina'],
        correctIndex: 2,
        explanation: 'Brazil has won a record five FIFA World Cup trophies (1958, 1962, 1970, 1994, and 2002).',
      },
      {
        id: 'soc-q2',
        question: 'What is the standard regulation duration of a professional soccer match (excluding extra time)?',
        options: ['80 minutes', '90 minutes', '100 minutes', '120 minutes'],
        correctIndex: 1,
        explanation: 'Regulation matches consist of two 45-minute halves for a total of 90 minutes plus stoppage time.',
      },
      {
        id: 'soc-q3',
        question: 'Which club holds the all-time record for the most UEFA Champions League titles?',
        options: ['AC Milan', 'Bayern Munich', 'Real Madrid', 'Liverpool'],
        correctIndex: 2,
        explanation: 'Real Madrid leads European club football with 15 European Cup / UEFA Champions League titles.',
      },
      {
        id: 'soc-q4',
        question: "Who has won the most Men's Ballon d'Or awards in football history?",
        options: ['Cristiano Ronaldo', 'Lionel Messi', 'Pelé', 'Johan Cruyff'],
        correctIndex: 1,
        explanation: "Lionel Messi has won a record 8 Ballon d'Or trophies across his historic career.",
      },
      {
        id: 'soc-q5',
        question: 'From what distance from the goal line is a standard penalty kick taken?',
        options: ['10 yards (9.15 m)', '12 yards (11 m)', '15 yards (13.7 m)', '18 yards (16.5 m)'],
        correctIndex: 1,
        explanation: 'A penalty kick is taken from the penalty mark located exactly 12 yards (11 meters) from the center of the goal line.',
      },
    ],
  },
  {
    id: 'hispanic-capitals',
    title: 'Capitals of Hispanic Countries',
    description: 'Journey across the Spanish-speaking world: test your geography knowledge on the capitals of Hispanic nations.',
    category: 'Geography',
    difficulty: 'Medium',
    questions: [
      {
        id: 'geo-q1',
        question: 'What is the capital city of Colombia?',
        options: ['Medellín', 'Cali', 'Bogotá', 'Cartagena'],
        correctIndex: 2,
        explanation: 'Bogotá (Distrito Capital) is the high-altitude capital and largest city of Colombia.',
      },
      {
        id: 'geo-q2',
        question: 'What is the capital city of Argentina, situated along the Río de la Plata?',
        options: ['Córdoba', 'Buenos Aires', 'Rosario', 'Mendoza'],
        correctIndex: 1,
        explanation: 'Buenos Aires is the federal capital and largest metropolitan area of Argentina.',
      },
      {
        id: 'geo-q3',
        question: 'Which city serves as the capital of Spain, home to the Prado Museum and Royal Palace?',
        options: ['Barcelona', 'Seville', 'Valencia', 'Madrid'],
        correctIndex: 3,
        explanation: 'Madrid is the capital and largest municipality of Spain, located in the center of the country.',
      },
      {
        id: 'geo-q4',
        question: "What is the capital of Peru, founded in 1535 and known as the 'City of the Kings'?",
        options: ['Cusco', 'Arequipa', 'Lima', 'Trujillo'],
        correctIndex: 2,
        explanation: 'Lima is the coastal capital city of Peru, established as the Ciudad de los Reyes by Francisco Pizarro in 1535.',
      },
      {
        id: 'geo-q5',
        question: 'What is the capital city of Costa Rica?',
        options: ['San José', 'Alajuela', 'Heredia', 'Cartago'],
        correctIndex: 0,
        explanation: 'San José is the capital and cultural center of Costa Rica, located in the central plateau region.',
      },
    ],
  },
  {
    id: 'football',
    title: 'American Football & NFL',
    description: 'Test your gridiron knowledge on NFL rules, scoring systems, field dimensions, and Super Bowl milestones.',
    category: 'Football',
    difficulty: 'Medium',
    questions: [
      {
        id: 'fb-q1',
        question: 'How many points is a touchdown worth in American football?',
        options: ['3 points', '6 points', '7 points', '8 points'],
        correctIndex: 1,
        explanation: 'A touchdown scores 6 points, followed by a try for 1 point (extra point kick) or 2 points (two-point conversion).',
      },
      {
        id: 'fb-q2',
        question: 'How long is the field of play in an NFL game between the two goal lines (excluding end zones)?',
        options: ['80 yards', '100 yards', '110 yards', '120 yards'],
        correctIndex: 1,
        explanation: 'The field of play is 100 yards from goal line to goal line. Including both 10-yard end zones, the total field is 120 yards.',
      },
      {
        id: 'fb-q3',
        question: 'Which quarterback has won the most Super Bowl titles in NFL history?',
        options: ['Joe Montana', 'Peyton Manning', 'Tom Brady', 'Patrick Mahomes'],
        correctIndex: 2,
        explanation: 'Tom Brady won a record seven Super Bowls (six with New England and one with Tampa Bay).',
      },
      {
        id: 'fb-q4',
        question: 'How many downs does the offensive team have to advance the ball 10 yards?',
        options: ['3 downs', '4 downs', '5 downs', '6 downs'],
        correctIndex: 1,
        explanation: 'The offense is given a series of 4 downs to advance the ball at least 10 yards to earn a new first down.',
      },
      {
        id: 'fb-q5',
        question: 'How many points are awarded for a successful field goal in American football?',
        options: ['1 point', '2 points', '3 points', '4 points'],
        correctIndex: 2,
        explanation: 'A field goal successfully kicked through the opponent goal posts during regular play scores 3 points.',
      },
    ],
  },
  {
    id: 'english-vocab',
    title: 'English Vocabulary Mastery',
    description: 'Challenge your lexicon with advanced English vocabulary, definitions, synonyms, and context usage.',
    category: 'Vocabulary',
    difficulty: 'Hard',
    questions: [
      {
        id: 'vocab-q1',
        question: "What is the definition of the word 'ephemeral'?",
        options: ['Enduring forever', 'Lasting for a very short time', 'Difficult to comprehend', 'Extremely spacious'],
        correctIndex: 1,
        explanation: "'Ephemeral' describes something that is fleeting, transient, or lasting for only a brief period of time.",
      },
      {
        id: 'vocab-q2',
        question: "Which word is the closest synonym for 'meticulous'?",
        options: ['Careless', 'Painstaking', 'Aggressive', 'Indifferent'],
        correctIndex: 1,
        explanation: "'Meticulous' means taking extreme care about minute details; precise and painstaking.",
      },
      {
        id: 'vocab-q3',
        question: "What does the adjective 'garrulous' mean?",
        options: ['Excessively talkative', 'Secretive and guarded', 'Fierce and warlike', 'Easily frightened'],
        correctIndex: 0,
        explanation: "'Garrulous' means pointlessly or annoyingly talkative, especially regarding trivial matters.",
      },
      {
        id: 'vocab-q4',
        question: "If an action is described as 'altruistic', what is its primary characteristic?",
        options: [
          'Motivated purely by financial profit',
          'Selflessly devoted to the welfare of others',
          'Hesitant and indecisive',
          'Quick to anger without provocation',
        ],
        correctIndex: 1,
        explanation: "'Altruistic' means showing unselfish concern for and devotion to the well-being of other people.",
      },
      {
        id: 'vocab-q5',
        question: "What does the word 'ubiquitous' mean?",
        options: ['Rare and precious', 'Present or appearing everywhere', 'Outdated and obsolete', 'Unusually swift'],
        correctIndex: 1,
        explanation: "'Ubiquitous' describes something that is omnipresent or found everywhere at the same time.",
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

  // Phase 2 & 3: Quiz Attempts table (storing scores, percentage, answers, status, and completion timestamp)
  const createAttemptsTableQuery = `
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      quiz_id VARCHAR(50) REFERENCES quizzes(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      percentage INTEGER NOT NULL,
      answers TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'completed',
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
 * Seed quizzes and questions, updating existing and syncing catalog
 */
async function seedQuizzesIfEmpty() {
  console.log('[DB] Seeding default quizzes (Soccer, Hispanic Capitals, Football, English Vocab)...');

  for (const quiz of SEED_QUIZZES) {
    await query(
      `INSERT INTO quizzes (id, title, description, category, difficulty)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         category = EXCLUDED.category,
         difficulty = EXCLUDED.difficulty`,
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
         ON CONFLICT (id) DO UPDATE SET
           quiz_id = EXCLUDED.quiz_id,
           question = EXCLUDED.question,
           options = EXCLUDED.options,
           correct_index = EXCLUDED.correct_index,
           explanation = EXCLUDED.explanation,
           order_num = EXCLUDED.order_num`,
        [q.id, quiz.id, q.question, JSON.stringify(q.options), q.correctIndex, q.explanation, order++]
      );
    }
  }

  // Remove any obsolete legacy quizzes that are not in SEED_QUIZZES
  const validIds = SEED_QUIZZES.map((q) => q.id);
  const placeholders = validIds.map((_, i) => `$${i + 1}`).join(',');
  await query(`DELETE FROM quizzes WHERE id NOT IN (${placeholders})`, validIds);

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
 * Record a quiz attempt in the database with status ('completed' or 'incomplete')
 */
async function recordQuizAttempt({ userId, quizId, score, totalQuestions, percentage, answers, status = 'completed' }) {
  const res = await query(
    `INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions, percentage, answers, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, user_id, quiz_id, score, total_questions, percentage, status, completed_at`,
    [
      userId || null,
      quizId,
      score,
      totalQuestions,
      percentage,
      typeof answers === 'string' ? answers : JSON.stringify(answers),
      status,
    ]
  );
  return res.rows[0];
}

/**
 * Get past attempts for a given user.
 * By default, only returns completed attempts so unfinished/incomplete attempts
 * are prevented from counting as completed attempts.
 */
async function getQuizAttemptsByUserId(userId, onlyCompleted = true) {
  const sql = onlyCompleted
    ? `SELECT qa.id, qa.quiz_id, q.title as quiz_title, q.category, q.difficulty,
              qa.score, qa.total_questions, qa.percentage, qa.status, qa.completed_at
       FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       WHERE qa.user_id = $1 AND qa.status = 'completed'
       ORDER BY qa.completed_at DESC, qa.id DESC`
    : `SELECT qa.id, qa.quiz_id, q.title as quiz_title, q.category, q.difficulty,
              qa.score, qa.total_questions, qa.percentage, qa.status, qa.completed_at
       FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       WHERE qa.user_id = $1
       ORDER BY qa.completed_at DESC, qa.id DESC`;

  const res = await query(sql, [userId]);
  return res.rows;
}

/**
 * Compute aggregate performance statistics for a player based strictly on completed attempts
 */
async function getUserQuizStats(userId) {
  const attempts = await getQuizAttemptsByUserId(userId, true);
  if (attempts.length === 0) {
    return {
      totalCompleted: 0,
      averagePercentage: 0,
      bestPercentage: 0,
      quizzesMastered: 0,
    };
  }

  const totalCompleted = attempts.length;
  const sumPercentage = attempts.reduce((acc, a) => acc + a.percentage, 0);
  const averagePercentage = Math.round(sumPercentage / totalCompleted);
  const bestPercentage = Math.max(...attempts.map((a) => a.percentage));
  const quizzesMastered = attempts.filter((a) => a.percentage >= 80).length;

  return {
    totalCompleted,
    averagePercentage,
    bestPercentage,
    quizzesMastered,
  };
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
  getUserQuizStats,
  closeDb,
  isInMemoryDatabase: () => isInMemory,
  SEED_QUIZZES,
};
