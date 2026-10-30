const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/quizzes
 * Returns all available quizzes with question counts and metadata
 */
router.get('/', async (req, res) => {
  try {
    const quizzes = await db.getQuizzes();
    return res.json({
      status: 'success',
      count: quizzes.length,
      quizzes,
    });
  } catch (err) {
    console.error('[QUIZ] Error fetching quizzes:', err);
    return res.status(500).json({ error: 'Failed to retrieve available quizzes.' });
  }
});

/**
 * GET /api/quizzes/attempts/my
 * Returns personal quiz history and statistics for the authenticated user.
 * Strictly scopes to req.session.userId and filters by completed status by default.
 */
router.get('/attempts/my', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required to view quiz history.' });
  }

  try {
    const onlyCompleted = req.query.onlyCompleted === 'true';
    const allAttempts = await db.getQuizAttemptsByUserId(req.session.userId, false);
    const completedAttempts = allAttempts.filter((a) => a.status === 'completed');
    const attempts = onlyCompleted ? completedAttempts : allAttempts;
    const stats = await db.getUserQuizStats(req.session.userId);

    return res.json({
      status: 'success',
      userId: req.session.userId,
      username: req.session.username,
      count: attempts.length,
      stats,
      attempts,
      completedAttempts,
    });
  } catch (err) {
    console.error('[QUIZ] Error fetching attempts:', err);
    return res.status(500).json({ error: 'Failed to retrieve quiz attempts.' });
  }
});

/**
 * GET /api/quizzes/attempts/:id/review
 * Retrieves complete historical question breakdown and answers for a specific attempt.
 * Allows the student to review their past quiz results in detail.
 */
router.get('/attempts/:id/review', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required to review quiz attempts.' });
  }

  try {
    const attemptId = parseInt(req.params.id, 10);
    const attempt = await db.getAttemptById(attemptId);
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt record not found.' });
    }

    // Privacy guard: player can only view their own attempts (admin can view any)
    if (req.session.userRole !== 'admin' && attempt.user_id !== req.session.userId) {
      return res.status(403).json({ error: 'Access denied to this attempt record.' });
    }

    const questionsWithAnswers = await db.getQuestionsByQuizId(attempt.quiz_id, true);
    const answerMap = attempt.answers || {};

    const results = questionsWithAnswers.map((q) => {
      const selected = answerMap[q.id];
      const isAnswered = selected !== undefined && selected !== null && selected !== '';
      const selectedIndex = isAnswered ? parseInt(selected, 10) : null;
      const isValidChoice = Number.isInteger(selectedIndex) && selectedIndex >= 0 && selectedIndex <= 3;
      const isCorrect = isValidChoice && selectedIndex === q.correctIndex;

      return {
        questionId: q.id,
        question: q.question,
        options: q.options,
        selectedIndex: isValidChoice ? selectedIndex : null,
        correctIndex: q.correctIndex,
        isCorrect,
        unanswered: !isAnswered,
        explanation: q.explanation,
      };
    });

    return res.json({
      status: 'success',
      attempt: {
        id: attempt.id,
        quizId: attempt.quiz_id,
        quizTitle: attempt.quiz_title,
        category: attempt.category,
        difficulty: attempt.difficulty,
        score: attempt.score,
        totalQuestions: attempt.total_questions,
        percentage: attempt.percentage,
        status: attempt.status,
        completedAt: attempt.completed_at,
        results,
      },
    });
  } catch (err) {
    console.error('[QUIZ] Error reviewing attempt:', err);
    return res.status(500).json({ error: 'Failed to retrieve attempt review.' });
  }
});

/**
 * POST /api/quizzes/:id/abandon
 * Records an unfinished/abandoned attempt as status = 'incomplete'.
 * Explicitly prevents unfinished attempts from counting as completed attempts.
 */
router.post('/:id/abandon', async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await db.getQuizById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: `Quiz "${quizId}" not found.` });
    }

    const userId = req.session && req.session.userId ? req.session.userId : null;
    const questions = await db.getQuestionsByQuizId(quizId, false);
    const { partialAnswers = {} } = req.body || {};

    const attemptRecord = await db.recordQuizAttempt({
      userId,
      quizId,
      score: 0,
      totalQuestions: questions.length,
      percentage: 0,
      answers: partialAnswers,
      status: 'incomplete',
    });

    return res.status(200).json({
      status: 'success',
      message: 'Unfinished attempt recorded as incomplete (does not count as completed).',
      attemptId: attemptRecord.id,
      attemptStatus: 'incomplete',
    });
  } catch (err) {
    console.error('[QUIZ] Error recording abandoned attempt:', err);
    return res.status(500).json({ error: 'Failed to record unfinished quiz attempt.' });
  }
});

/**
 * GET /api/quizzes/:id
 * Returns quiz metadata and questions for taking the quiz.
 * SECURITY: NEVER returns correctIndex or explanation to prevent cheating!
 */
router.get('/:id', async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await db.getQuizById(quizId);

    if (!quiz) {
      return res.status(404).json({ error: `Quiz "${quizId}" not found.` });
    }

    // Retrieve questions WITHOUT answers
    const questions = await db.getQuestionsByQuizId(quizId, false);

    // Validate that each question has exactly 4 options
    for (const q of questions) {
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        return res.status(500).json({
          error: `Question ${q.id} is invalid: must have exactly four answer choices.`,
        });
      }
    }

    return res.json({
      status: 'success',
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        difficulty: quiz.difficulty,
        totalQuestions: questions.length,
        questions,
      },
    });
  } catch (err) {
    console.error('[QUIZ] Error fetching quiz details:', err);
    return res.status(500).json({ error: 'Failed to load quiz.' });
  }
});

/**
 * POST /api/quizzes/:id/submit
 * Submits answers, calculates score and percentage, records attempt,
 * and returns detailed graded results.
 *
 * Payload format:
 * {
 *   "answers": {
 *     "q1": 2, // questionId -> selected option index (0-3)
 *     "q2": 1
 *   }
 * }
 * or
 * {
 *   "answers": [
 *     { "questionId": "q1", "selectedIndex": 2 }
 *   ]
 * }
 */
router.post('/:id/submit', async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await db.getQuizById(quizId);

    if (!quiz) {
      return res.status(404).json({ error: `Quiz "${quizId}" not found.` });
    }

    // Retrieve full question details with correct answers from DB
    const questionsWithAnswers = await db.getQuestionsByQuizId(quizId, true);

    if (!questionsWithAnswers || questionsWithAnswers.length === 0) {
      return res.status(500).json({ error: 'Quiz contains no questions.' });
    }

    const { answers } = req.body || {};

    // Validate request payload format: must be object or array (or null/undefined for empty submission)
    if (answers !== undefined && answers !== null && typeof answers !== 'object') {
      return res.status(400).json({
        error: 'Invalid submission format: "answers" must be an object map or an array.',
      });
    }

    // Normalize submitted answers into a lookup map: questionId -> selectedIndex
    const answerMap = {};

    if (Array.isArray(answers)) {
      for (const item of answers) {
        if (item && item.questionId) {
          answerMap[item.questionId] = item.selectedIndex;
        }
      }
    } else if (answers && typeof answers === 'object') {
      Object.assign(answerMap, answers);
    }

    let score = 0;
    const totalQuestions = questionsWithAnswers.length;
    const results = [];

    // Grade each question
    for (const q of questionsWithAnswers) {
      const selected = answerMap[q.id];
      const isAnswered = selected !== undefined && selected !== null && selected !== '';
      const selectedIndex = isAnswered ? parseInt(selected, 10) : null;

      // Check validity of selection (must be 0, 1, 2, or 3)
      const isValidChoice = Number.isInteger(selectedIndex) && selectedIndex >= 0 && selectedIndex <= 3;
      const isCorrect = isValidChoice && selectedIndex === q.correctIndex;

      if (isCorrect) {
        score++;
      }

      results.push({
        questionId: q.id,
        question: q.question,
        options: q.options,
        selectedIndex: isValidChoice ? selectedIndex : null,
        correctIndex: q.correctIndex,
        isCorrect: isCorrect,
        unanswered: !isAnswered,
        explanation: q.explanation,
      });
    }

    // Calculate percentage (0-100)
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const passed = percentage >= 70;

    // Distinguish completed vs incomplete attempts
    const answeredCount = questionsWithAnswers.filter(
      (q) => answerMap[q.id] !== undefined && answerMap[q.id] !== null && answerMap[q.id] !== ''
    ).length;
    const isCompleted = answeredCount === totalQuestions;
    const attemptStatus = isCompleted ? 'completed' : 'incomplete';

    // Persist attempt in database
    const userId = req.session && req.session.userId ? req.session.userId : null;
    const attemptRecord = await db.recordQuizAttempt({
      userId,
      quizId,
      score,
      totalQuestions,
      percentage,
      answers: answerMap,
      status: attemptStatus,
    });

    if (isCompleted && userId) {
      await db.markAssignmentCompleted(quizId, userId).catch((err) => {
        console.error('[QUIZ] Error marking assignment completed:', err);
      });
    }

    return res.status(200).json({
      status: 'success',
      attemptStatus: attemptStatus,
      isCompleted,
      attemptId: attemptRecord.id,
      quizId: quiz.id,
      quizTitle: quiz.title,
      category: quiz.category,
      difficulty: quiz.difficulty,
      score,
      totalQuestions,
      percentage,
      passed,
      completedAt: attemptRecord.completed_at,
      results,
    });
  } catch (err) {
    console.error('[QUIZ] Error processing quiz submission:', err);
    return res.status(500).json({ error: 'An error occurred while grading the quiz.' });
  }
});

module.exports = router;
