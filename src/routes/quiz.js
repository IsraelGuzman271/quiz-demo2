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
 * Returns quiz history for the authenticated user
 */
router.get('/attempts/my', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required to view quiz history.' });
  }

  try {
    const attempts = await db.getQuizAttemptsByUserId(req.session.userId);
    return res.json({
      status: 'success',
      attempts,
    });
  } catch (err) {
    console.error('[QUIZ] Error fetching attempts:', err);
    return res.status(500).json({ error: 'Failed to retrieve quiz attempts.' });
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

    // Persist attempt in database
    const userId = req.session && req.session.userId ? req.session.userId : null;
    const attemptRecord = await db.recordQuizAttempt({
      userId,
      quizId,
      score,
      totalQuestions,
      percentage,
      answers: answerMap,
    });

    return res.status(200).json({
      status: 'success',
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
