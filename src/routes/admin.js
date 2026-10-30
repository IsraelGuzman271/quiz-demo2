const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../auth');

// All routes in this router require admin role
router.use(requireAdmin);

/**
 * Utility: Parse CSV text into 2D array of rows
 */
function parseCSV(text) {
  if (!text || typeof text !== 'string') return [];
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Utility: Normalize correct answer into 0, 1, 2, 3
 */
function normalizeCorrectChoice(val) {
  if (val === undefined || val === null) return null;
  const str = String(val).trim().toUpperCase();
  if (str === '0' || str === 'A') return 0;
  if (str === '1' || str === 'B') return 1;
  if (str === '2' || str === 'C') return 2;
  if (str === '3' || str === 'D') return 3;
  return null;
}

/**
 * GET /api/admin/overview
 * Restricted to administrators only.
 */
router.get('/overview', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    const quizzes = await db.getQuizzes();
    const assignments = await db.getAllAssignments();
    const playerCount = users.filter((u) => u.role === 'player').length;
    const adminCount = users.filter((u) => u.role === 'admin').length;

    return res.json({
      status: 'success',
      message: 'Admin authorization granted.',
      adminUser: req.session.username,
      stats: {
        totalUsers: users.length,
        players: playerCount,
        admins: adminCount,
        totalQuizzes: quizzes.length,
        totalAssignments: assignments.length,
      },
      users,
      quizzes,
    });
  } catch (err) {
    console.error('[ADMIN] Overview error:', err);
    return res.status(500).json({
      error: 'Failed to retrieve admin system overview.',
    });
  }
});

/**
 * POST /api/admin/system-action
 * Restricted admin action (system audit or maintenance toggle)
 */
router.post('/system-action', (req, res) => {
  const { actionName = 'system_diagnostics' } = req.body || {};
  return res.json({
    status: 'success',
    executedAction: actionName,
    executedBy: req.session.username,
    timestamp: new Date().toISOString(),
    message: `Administrative action "${actionName}" executed successfully.`,
  });
});

/**
 * GET /api/admin/quizzes/:id/questions
 * Returns all questions for a quiz, including correct answers and explanations (admin-only).
 */
router.get('/quizzes/:id/questions', async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await db.getQuizById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: `Quiz "${quizId}" not found.` });
    }

    const questions = await db.getQuestionsByQuizId(quizId, true);
    return res.json({
      status: 'success',
      quizId,
      quizTitle: quiz.title,
      count: questions.length,
      questions,
    });
  } catch (err) {
    console.error('[ADMIN] Error fetching quiz questions:', err);
    return res.status(500).json({ error: 'Failed to retrieve questions.' });
  }
});

/**
 * POST /api/admin/questions
 * Adds a new question to a quiz.
 * Strictly enforces exactly 4 choices.
 */
router.post('/questions', async (req, res) => {
  try {
    const { quizId, question, options, correctIndex, explanation = '', orderNum = 0 } = req.body;

    if (!quizId || !question) {
      return res.status(400).json({ error: 'Quiz ID and question text are required.' });
    }

    const quiz = await db.getQuizById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: `Quiz "${quizId}" does not exist.` });
    }

    if (!Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({ error: 'Question must have exactly four answer choices.' });
    }

    for (let i = 0; i < options.length; i++) {
      if (typeof options[i] !== 'string' || options[i].trim() === '') {
        return res.status(400).json({ error: `Option ${i + 1} cannot be empty.` });
      }
    }

    const parsedIndex = parseInt(correctIndex, 10);
    if (!Number.isInteger(parsedIndex) || parsedIndex < 0 || parsedIndex > 3) {
      return res.status(400).json({ error: 'Correct answer index must be an integer between 0 and 3.' });
    }

    const newQ = await db.createQuestion({
      quizId,
      question: question.trim(),
      options: options.map((o) => o.trim()),
      correctIndex: parsedIndex,
      explanation: (explanation || '').trim(),
      orderNum: parseInt(orderNum, 10) || 0,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Question created successfully.',
      question: newQ,
    });
  } catch (err) {
    console.error('[ADMIN] Error creating question:', err);
    return res.status(500).json({ error: 'Failed to create question.' });
  }
});

/**
 * PUT /api/admin/questions/:id
 * Updates an existing question.
 */
router.put('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getQuestionById(id);
    if (!existing) {
      return res.status(404).json({ error: `Question "${id}" not found.` });
    }

    const { question, options, correctIndex, explanation } = req.body;

    const newQuestion = question !== undefined ? question.trim() : existing.question;
    const newExplanation = explanation !== undefined ? explanation.trim() : existing.explanation;

    let newOptions = existing.options;
    if (options !== undefined) {
      if (!Array.isArray(options) || options.length !== 4) {
        return res.status(400).json({ error: 'Question must have exactly four answer choices.' });
      }
      for (let i = 0; i < options.length; i++) {
        if (typeof options[i] !== 'string' || options[i].trim() === '') {
          return res.status(400).json({ error: `Option ${i + 1} cannot be empty.` });
        }
      }
      newOptions = options.map((o) => o.trim());
    }

    let newCorrectIndex = existing.correctIndex;
    if (correctIndex !== undefined) {
      const parsed = parseInt(correctIndex, 10);
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 3) {
        return res.status(400).json({ error: 'Correct answer index must be an integer between 0 and 3.' });
      }
      newCorrectIndex = parsed;
    }

    const updated = await db.updateQuestion(id, {
      question: newQuestion,
      options: newOptions,
      correctIndex: newCorrectIndex,
      explanation: newExplanation,
    });

    return res.json({
      status: 'success',
      message: 'Question updated successfully.',
      question: updated,
    });
  } catch (err) {
    console.error('[ADMIN] Error updating question:', err);
    return res.status(500).json({ error: 'Failed to update question.' });
  }
});

/**
 * DELETE /api/admin/questions/:id
 * Deletes a question.
 */
router.delete('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getQuestionById(id);
    if (!existing) {
      return res.status(404).json({ error: `Question "${id}" not found.` });
    }

    await db.deleteQuestion(id);
    return res.json({
      status: 'success',
      message: `Question "${id}" deleted successfully.`,
      deletedId: id,
    });
  } catch (err) {
    console.error('[ADMIN] Error deleting question:', err);
    return res.status(500).json({ error: 'Failed to delete question.' });
  }
});

/**
 * GET /api/admin/assignments
 * Lists all quiz assignments across users.
 */
router.get('/assignments', async (req, res) => {
  try {
    const assignments = await db.getAllAssignments();
    return res.json({
      status: 'success',
      count: assignments.length,
      assignments,
    });
  } catch (err) {
    console.error('[ADMIN] Error fetching assignments:', err);
    return res.status(500).json({ error: 'Failed to retrieve assignments.' });
  }
});

/**
 * POST /api/admin/assignments
 * Assigns a quiz to a player.
 */
router.post('/assignments', async (req, res) => {
  try {
    const { quizId, userId, note = '', dueDate = null } = req.body;

    if (!quizId || !userId) {
      return res.status(400).json({ error: 'quizId and userId are required to create an assignment.' });
    }

    const quiz = await db.getQuizById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: `Quiz "${quizId}" not found.` });
    }

    const user = await db.getUserById(parseInt(userId, 10));
    if (!user) {
      return res.status(404).json({ error: `User ID "${userId}" not found.` });
    }

    const assignment = await db.createAssignment({
      quizId,
      userId: user.id,
      assignedBy: req.session.userId,
      note: (note || '').trim(),
      dueDate: dueDate || null,
    });

    return res.status(201).json({
      status: 'success',
      message: `Quiz "${quiz.title}" assigned to user "${user.username}".`,
      assignment,
    });
  } catch (err) {
    console.error('[ADMIN] Error creating assignment:', err);
    return res.status(500).json({ error: 'Failed to create assignment.' });
  }
});

/**
 * DELETE /api/admin/assignments/:id
 * Deletes an assignment.
 */
router.delete('/assignments/:id', async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id, 10);
    const deleted = await db.deleteAssignment(assignmentId);
    if (!deleted) {
      return res.status(404).json({ error: `Assignment "${assignmentId}" not found.` });
    }

    return res.json({
      status: 'success',
      message: 'Assignment removed successfully.',
      deletedId: assignmentId,
    });
  } catch (err) {
    console.error('[ADMIN] Error deleting assignment:', err);
    return res.status(500).json({ error: 'Failed to delete assignment.' });
  }
});

/**
 * POST /api/admin/questions/csv-preview
 * Previews and validates CSV question data without committing to database.
 * Reports line-by-line syntax, missing field, or schema errors.
 */
router.post('/questions/csv-preview', async (req, res) => {
  try {
    const { csvText } = req.body || {};
    if (!csvText || typeof csvText !== 'string' || csvText.trim() === '') {
      return res.status(400).json({ error: 'CSV content is required.' });
    }

    const rows = parseCSV(csvText);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'CSV is empty.' });
    }

    const quizzes = await db.getQuizzes();
    const validQuizIds = new Set(quizzes.map((q) => q.id));

    let startIndex = 0;
    // Check if row 0 is header
    const firstCol = rows[0][0]?.toLowerCase();
    if (firstCol === 'quiz_id' || firstCol === 'quizid') {
      startIndex = 1;
    }

    const validRows = [];
    const invalidRows = [];

    for (let i = startIndex; i < rows.length; i++) {
      const lineNum = i + 1;
      const cols = rows[i];
      const errors = [];

      if (cols.length < 7) {
        errors.push(`Expected at least 7 columns (quiz_id, question, option_a, option_b, option_c, option_d, correct_choice). Found ${cols.length}.`);
      } else {
        const quizId = cols[0];
        const questionText = cols[1];
        const options = [cols[2], cols[3], cols[4], cols[5]];
        const rawChoice = cols[6];
        const explanation = cols[7] || '';

        if (!quizId) {
          errors.push('Quiz ID is missing.');
        } else if (!validQuizIds.has(quizId)) {
          errors.push(`Quiz ID "${quizId}" does not exist in the database.`);
        }

        if (!questionText || questionText.trim() === '') {
          errors.push('Question text is missing.');
        }

        for (let j = 0; j < 4; j++) {
          if (!options[j] || options[j].trim() === '') {
            errors.push(`Option ${j + 1} (${String.fromCharCode(65 + j)}) is empty.`);
          }
        }

        const correctIndex = normalizeCorrectChoice(rawChoice);
        if (correctIndex === null) {
          errors.push(`Invalid correct choice "${rawChoice}". Must be 0-3 or A-D.`);
        }

        if (errors.length === 0) {
          validRows.push({
            lineNumber: lineNum,
            quizId,
            question: questionText.trim(),
            options: options.map((o) => o.trim()),
            correctIndex,
            explanation: explanation.trim(),
          });
          continue;
        }
      }

      invalidRows.push({
        lineNumber: lineNum,
        raw: cols.join(','),
        errors,
      });
    }

    return res.json({
      status: 'success',
      totalRows: rows.length - startIndex,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      canImport: invalidRows.length === 0 && validRows.length > 0,
      validRows,
      invalidRows,
    });
  } catch (err) {
    console.error('[ADMIN] Error in CSV preview:', err);
    return res.status(500).json({ error: 'Failed to process CSV preview.' });
  }
});

/**
 * POST /api/admin/questions/csv-import
 * Imports validated CSV question rows into the database.
 * If abortOnError is true (default) and any invalid rows exist, blocks import.
 */
router.post('/questions/csv-import', async (req, res) => {
  try {
    const { csvText, questions, allowPartial = false } = req.body || {};

    let itemsToImport = [];

    if (Array.isArray(questions)) {
      itemsToImport = questions;
    } else if (csvText && typeof csvText === 'string') {
      // Re-run preview validation
      const rows = parseCSV(csvText);
      const quizzes = await db.getQuizzes();
      const validQuizIds = new Set(quizzes.map((q) => q.id));

      let startIndex = 0;
      const firstCol = rows[0]?.[0]?.toLowerCase();
      if (firstCol === 'quiz_id' || firstCol === 'quizid') {
        startIndex = 1;
      }

      const invalidRows = [];

      for (let i = startIndex; i < rows.length; i++) {
        const lineNum = i + 1;
        const cols = rows[i];
        const errors = [];

        if (cols.length < 7) {
          errors.push(`Row has insufficient columns.`);
        } else {
          const [quizId, questionText, o0, o1, o2, o3, rawChoice, rawExp] = cols;
          const options = [o0, o1, o2, o3];
          const choice = normalizeCorrectChoice(rawChoice);

          if (!quizId || !validQuizIds.has(quizId)) errors.push(`Invalid quiz ID "${quizId}".`);
          if (!questionText || questionText.trim() === '') errors.push('Empty question text.');
          if (options.some((o) => !o || o.trim() === '')) errors.push('All 4 options must be non-empty.');
          if (choice === null) errors.push(`Invalid correct choice "${rawChoice}".`);

          if (errors.length === 0) {
            itemsToImport.push({
              quizId,
              question: questionText.trim(),
              options: options.map((o) => o.trim()),
              correctIndex: choice,
              explanation: (rawExp || '').trim(),
            });
            continue;
          }
        }

        invalidRows.push({ lineNumber: lineNum, errors });
      }

      if (invalidRows.length > 0 && !allowPartial) {
        return res.status(400).json({
          error: 'CSV validation failed. Fix errors or enable partial import.',
          invalidCount: invalidRows.length,
          invalidRows,
        });
      }
    } else {
      return res.status(400).json({ error: 'Either csvText or questions array is required.' });
    }

    if (itemsToImport.length === 0) {
      return res.status(400).json({ error: 'No valid questions to import.' });
    }

    const imported = [];
    for (const item of itemsToImport) {
      const created = await db.createQuestion(item);
      imported.push(created);
    }

    return res.status(201).json({
      status: 'success',
      message: `Successfully imported ${imported.length} question(s).`,
      importedCount: imported.length,
      imported,
    });
  } catch (err) {
    console.error('[ADMIN] Error importing CSV questions:', err);
    return res.status(500).json({ error: 'Failed to import CSV questions.' });
  }
});

module.exports = router;
